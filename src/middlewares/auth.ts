import {verifyToken} from "../libs/utils";



export async function logUserIn(req: any, res: any, next: any) {
    const accessToken = req.cookies['access_token'];
    if (accessToken) {
        try {
            req.user = await verifyToken(accessToken);
        } catch (e) {
            //     remove token from cookies
            res.clearCookie('access_token');
            return res.status(401).send('Invalid token. Please retry this.');
        }
    } else {
        //try to get access_token from body, params, or query
        const accessToken = req.body.access_token || req.query.access_token || req.params.access_token;
        console.log(accessToken, " access token")
        if (accessToken) {
            try {
                req.user = await verifyToken(accessToken);
            } catch (e) {
                console.log(e);
                return res.status(401).send('Invalid token. Please retry this fuck you.');
            }
        }
    }

    next();
}

//role
export const ROLE = {
    ADMIN: 'admin',
    BUYER: 'buyer',
    VENDOR: 'vendor'
}

//role based access control
export function accessControl(roles: string[]) {
    return function (req: any, res: any, next: any) {
        console.log(req.user)
        if (roles.includes("admin") ) {
            next();
        } else if (req.user) {
            next();
        } else {
            console.log("Helloooo")
            return res.status(403).send('Forbidden');
        }
    }
}

//require auth
export function requireAuth(req: any, res: any, next: any) {
    if (req.user) {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
}

export function requireVerifiedUser(req: any, res: any, next: any) {
    next()
}

//
// var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
//
// passport.use(new GoogleStrategy({
//         clientID:     .GOOGLE_CLIENT_ID,
//         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//         callbackURL: "http://yourdomain:3000/auth/google/callback",
//         passReqToCallback   : true
//     },
//     async function (request: any, accessToken: string, refreshToken: any, profile: any, done: (err: any, user: any) => void) {
//
//         const existingUser = await AppDataSource.manager.findOne(User, {
//             where: {
//                 email: profile.email
//             },
//             relations: ['oAuthAccounts']
//         })
//
//         if(existingUser) {
//             const existingGoogleAccount = existingUser.oAuthAccounts.find((account: OAuthAccount) => account.provider === 'google');
//             if(existingGoogleAccount) {
//                 existingGoogleAccount.accessToken = accessToken;
//                 await AppDataSource.manager.save(existingGoogleAccount);
//             } else {
//                 const newGoogleAccount = {
//                     provider: 'google',
//                     accessToken,
//                     user: existingUser
//                 }
//                 await AppDataSource.manager.save(newGoogleAccount);
//             }
//             return done(null, existingUser);
//         }
//
//         const user = {
//             id: profile.id,
//             firstName: profile.name.givenName,
//             lastName: profile.name.familyName,
//             email: profile.email,
//             picture: profile.picture,
//         }
//         done(null, user);
//     }
// ));
