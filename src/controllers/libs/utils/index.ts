import {User} from "../../../entity/User";
import {AppDataSource} from "../../../libs/data-source";
import {Verification} from "../../../entity/Verification";
import {createVendor} from "../../vendor";
import * as nodemailer from "nodemailer";
import * as crypto from "crypto";
import {NewOrder} from "../../../entity/Product";

export async function makeAllUsersVendors() {
    const users = await AppDataSource.manager.find(User);
    for (const user of users) {
        try {
            await createVendor(user);

        } catch (err) {
            console.log(err);
        }
    }
}

async function generateCode(user: User, type_payload: {
    type: 'account'
} | {
    type: 'email',
    email: string
} | {
    type: 'phone',
    phone: string
} = {type: 'account'}) {
    const code = crypto.randomBytes(20).toString('hex');


    let existingVerification = await AppDataSource.manager.findOne(Verification, {
        where: {
            user: {
                id: user.id
            },
            type: type_payload.type
        },
        relations: ['user']
    })

    if (existingVerification) {
        await AppDataSource.manager.remove(existingVerification);
    }

    const verification = new Verification({
        code,
        user: user,
        ...type_payload
    });
    await AppDataSource.manager.save(verification);
    return code;
}

export async function sendVerificationEmail(req: any, email: string, user: User, emailOnlyVerification: boolean = false) {
    const code = await generateCode(user, emailOnlyVerification ? {type: 'email', email} : {type: 'account'});

    let link = `http://${req.get('host')}/verify/${code}`;

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: ` StyleMax: Verify Your Email`,
        // html: `<p>Click <a href="${link}">here</a> to verify your email</p>`
        html: `<html>
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="content-type" />
    <style type="text/css">
      @import url("https://fonts.googleapis.com/css?family=Inter:100,200,300,400,500,600,700,800,900&display=swap");
      body {
        margin: 0;
     
        /* inter font */
        font-family: "Inter", sans-serif;
        
      }

      .c0 {

        font-weight: 300;
        margin-bottom: 0.21em;
        line-height: 1.5em;
      }

      .c1 {
        margin-bottom: 0.21em;
        line-height: 1.5em;
        font-size: 1em;
      }

      .content {
        padding: 40px;

        
      }

      .content > * {
        margin-bottom: 30px;
      }

      .green {
        color: #385623;
      }

      .center {
        text-align: center;
      }

      .bold {
        font-weight: 600;
      }

      .large {
        font-size: 1.1em;
      }

      .note {
        font-size: 0.8em;
        color: #777777;
      }

      .footer {
        margin-top: 50px;
        padding-top: 20px;
        border-top: 1px solid #dddddd;
        background-color: #7f7f7f;
        height: 200px;
      }

      .logos {
        display: flex;
        justify-content: space-between;
        
        padding: 30px;
        padding-top: 0px;
        border-bottom: 1px solid #dddddd;
      }
      .social {
        display: flex;
        justify-content: center;
        margin: 20px 0;
        padding: 30px;

     
      }

      .social img {
        margin: 0 10px;
      }


    </style>
  </head>
  <body class="c8 doc-content">
   <div class="content">
    <p class="c1"><span class="c0"></span></p>

    <p class="c1"><span class="c0">Hey ${user.firstName},</span></p>
    <p class="c1"><span class="c0">Thanks for signing up!</span></p>
    <p class="c1">
      <span class="c0"
        >You have received this message because your email address has been
        registered with StyleMax.ca. Verify yourself and confirm your email by
        clicking below.</span
      >
    </p>
    <div style="align-items:center; display: flex; flex-direction: column; justify-content: center; width: 100%">
      <a
        style="
          background-color: #385623;
          border-radius: 1dvb;
          padding: 10px 20px;
          color: white;
          font-weight: 600;
          font-size: 1.5em;
          width: 25%;
          text-align: center;
          display: inline-block;
        "
        
        href="${link}"
      >
        Click Here
      </a>
      <p class="note">
        If it wasn&rsquo;t you who submitted your email address in the first
        place, well then that&rsquo;s messed up and we are sorry. Simply ignore
        this email and don&rsquo;t click above. You will not receive any email
        from us.
      </p>
  
    </div>

  
    
  
    <p class="c1 c3"><span class="c0"></span></p>
    <p class="green center bold large">What is StyleMax?</p>
    <p class="c1 c3"><span class="c2"></span></p>
    <p class="c1">
      <span class="green bold">StyleMax</span
      ><span class="c4"
        >&nbsp;is a platform to buy, sell, and rent pre-loved closet
        items.</span
      >
    </p>
    <p class="c1">
      <span class="c0"
        >Our platform will allow users to access stylish and affordable clothing
        options while contributing to sustainability by extending the life of
        clothing and reducing waste.</span
      >
    </p>

   </div>
    <div class="grey footer">
 
      <div class="logos">
        <img src="https://img.icons8.com/ios/60/dedede/chat.png"/>
        <img src="https://img.icons8.com/ios/60/dedede/shirt.png"/>
        <img src="https://img.icons8.com/ios/60/dedede/money.png"/>
      </div>


        <div class="social">
            <a href="https://www.instagram.com/stylemaxcanada/" target="_blank">
                <img src="https://img.icons8.com/ios/30/dedede/instagram-new.png"/>
            </a>
            <a href="https://www.facebook.com/profile.php?id=100093639055583" target="_blank">
                <img src="https://img.icons8.com/ios/30/dedede/facebook-new.png"/>
            </a>
            <!-- same for twitter and linkedin -->
            <a href="https://twitter.com/stylemaxinfo" target="_blank">
                <img src="https://img.icons8.com/ios/30/dedede/twitter.png"/>
            </a>
            <a href="https://www.linkedin.com/in/stylemax-ca-631946272/" target="_blank">
                <img src="https://img.icons8.com/ios/30/dedede/linkedin.png"/>
            </a>
        </div>
    <div>
     
  </body>
</html>
`
    };
    await sendEmail(mailOptions);


}

async function sendEmail(mailOptions: any) {

    const transporter = nodemailer.createTransport({
        service: process.env.SERVICE || 'Gmail',
        host: process.env.HOST || 'smtp.gmail.com',
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_PASSWORD
        }
    })
    await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(req: any, email: any, user: User) {
    const code = await generateCode(user);
    const link = `${process.env.FE_URL}/reset-password?code=${code}&user_id=${user.id}`;
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Reset your password',
        html: `<p>Click <a href="${link}">here</a> to reset your password</p>`
    };
    await sendEmail(mailOptions);
}

//send order confirmation email
export async function sendOrderConfirmationEmail(email: any, order: NewOrder) {
    let emailTemplate = `<html>
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="content-type" />
  </head>
  <body
    class="c8 doc-content"
    style="
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
        Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
        sans-serif;
    "
  >
    <div class="content" style="padding: 40px">
      <p style="margin-bottom: 30px">
        Hey ${order.buyer.firstName}, This is just a quick email to say we have received
        your order.
      </p>
      <p style="margin-bottom: 30px">
        Once everything is confirmed and ready to ship, we will send you another
        email with the tracking details and any other information about your
        order.
      </p>
      <p style="margin-bottom: 30px">
        Your shipping ETA applies from the time you receive that email, which
        should be about one working day from now. We will follow up as quickly
        as possible!
      </p>
      <p
        class="note"
        style="margin-bottom: 30px; font-size: 0.8em; color: #777777"
      >
        In the meantime, if you have any questions, send us an email at
        support@stylemax.ca and we will be happy to help
      </p>

      <table
        style="
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #dddddd;
          margin-bottom: 30px;
        "
      >
        <tr>
          <th style="border: 1px solid #dddddd; padding: 8px">Product</th>
          <th style="border: 1px solid #dddddd; padding: 8px">Colors</th>
          <th style="border: 1px solid #dddddd; padding: 8px">Size</th>
          <th style="border: 1px solid #dddddd; padding: 8px">Price</th>
        </tr>
        <tr>
          <td style="border: 1px solid #dddddd; padding: 8px">
            ${order.product.label}
          </td>
          <td style="border: 1px solid #dddddd; padding: 8px">
            ${order.product.colours.map((colour: any) => colour.label).join(', ')}
          </td>
          <td style="border: 1px solid #dddddd; padding: 8px">
            ${order.product.sizes[0].label}
          </td>
          <td style="border: 1px solid #dddddd; padding: 8px">
            ${order.final_price}
          </td>
        </tr>
      </table>

      <table
        style="
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #dddddd;
          margin-bottom: 30px;
        "
      >
      
      </table>
      <div>
        <h3>Shipping Address</h3>
        <p>
          ${order.shippingAddress.address}, ${order.shippingAddress.address2},
          ${order.shippingAddress.city}, ${order.shippingAddress.state},
          ${order.shippingAddress.country}, ${order.shippingAddress.zipCode}
        </p>
      </div>
    </div>
    <div
      class="grey footer"
      style="
        margin-top: 50px;
        padding-top: 20px;
        border-top: 1px solid #dddddd;
        background-color: #7f7f7f;
        height: 200px;
      "
    >
      
      <div
        class="logos"
        style="
          display: flex;
          justify-content: space-between;
          padding: 30px;
          padding-top: 0px;
          border-bottom: 1px solid #dddddd;
        "
      >
        <img src="https://img.icons8.com/ios/60/dedede/chat.png" />
        <img src="https://img.icons8.com/ios/60/dedede/shirt.png" />
        <img src="https://img.icons8.com/ios/60/dedede/money.png" />
      </div>


      <div
        class="social"
        style="
          display: flex;
          justify-content: center;
          margin: 20px 0;
          padding: 30px;
        "
      >
        <a href="https://www.instagram.com/stylemaxcanada/" target="_blank">
          <img
            src="https://img.icons8.com/ios/30/dedede/instagram-new.png"
            style="margin: 0 10px"
          />
        </a>
        <a href="https://www.facebook.com/profile.php?id=100093639055583" target="_blank">
          <img
            src="https://img.icons8.com/ios/30/dedede/facebook-new.png"
            style="margin: 0 10px"
          />
        </a>
        <!-- same for twitter and linkedin -->
        <a href="https://twitter.com/stylemaxinfo" target="_blank">
          <img
            src="https://img.icons8.com/ios/30/dedede/twitter.png"
            style="margin: 0 10px"
          />
        </a>
        <a href="https://www.linkedin.com/in/stylemax-ca-631946272/" target="_blank">
          <img
            src="https://img.icons8.com/ios/30/dedede/linkedin.png"
            style="margin: 0 10px"
          />
        </a>
      </div>
      <div></div>
    </div>
  </body>
</html>
`;
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Stylemax: Order Confirmation',
        html: emailTemplate
    };

    await sendEmail(mailOptions);
}
