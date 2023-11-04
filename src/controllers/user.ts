//user controller

import {Controller} from "./libs/definitions/controller";
import {User} from "../entity/User";
import {comparePassword, generateToken, hashPassword, setToken} from "../libs/utils";
import * as Joi from "joi";
import {AppDataSource} from "../libs/data-source";
import {Response} from "express";
import {Verification} from "../entity/Verification";
import {createVendor} from "./vendor";
import {sendPasswordResetEmail, sendVerificationEmail} from "./libs/utils";
import {uploadSinglePicture} from "./libs/uploadSinglePicture";

export class UserController extends Controller {


    /**
     * Log user into their last used role
     * If user was vendor or buyer, log them in as vendor or buyer
     * @param req
     * @param res
     */
    async login(req: any, res: any): Promise<unknown> {
        console.log({req})
        const schema = Joi
            .object()
            .keys({
                email: Joi.string().required(),
                password: Joi.string().required()
            })
            .unknown(true)
            .required()

        const result = schema
            .validate(req.body);

        if (result.error) {
            throw result.error;
        }

        const user = await AppDataSource.manager.findOne(User, {
            where: {
                email: req.body.email,
            }
        });

        if (!user) {
            console.log('yieeehos')
            throw new Error('Invalid email or password');
        }

        if (!user.isVerified) {
            throw new Error('Please verify your email. Check your email for verification link');
        }

        if(user.blocked_till){
            //check if blocked till is in the past
            if(new Date(user.blocked_till) < new Date()){
                //if blocked till is in the past, unblock user
                user.blocked_till = null as any;
                await AppDataSource.manager.save(user);
            }
            else{
                throw new Error('You are blocked from logging in till ' + user.blocked_till + '. Please contact admin for more information');
            }
        }

        if (!await comparePassword(req.body.password, user.password)) {
            console.log('yaha ayas')
            throw new Error('Invalid email or password');
        }

        if (!(user.role === 'vendor')) {
            //if user is not vendor, make them vendor
            await createVendor(user);
            user.role = 'vendor';
        }

        setToken(user, res);

        return user;
    }


    async logout(req: any, res: Response): Promise<unknown> {
        res.clearCookie('access_token');
        return {message: 'Logged out successfully'};
    }

    async signup(req: any, res: any): Promise<unknown> {
        const schema = Joi
            .object()
            .keys({
                email: Joi.string().required(),
                password: Joi.string().required(),
                firstName: Joi.string().required(),
                lastName: Joi.string().required()
            })
            .unknown(true)
            .required()

        const result = schema
            .validate(req.body);

        if (result.error) {
            throw result.error;
        }

        const user = new User({
            email: req.body.email,
            password: await hashPassword(req.body.password),
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            role: "user"

        });

        let savedUser;
        try {
            savedUser = await AppDataSource.manager.save(user);

            await sendVerificationEmail(req, savedUser.email, savedUser);
        } catch (err: any) {
            //     check if error is typeorm unique constraint error
            if (err.code === '23505') {
                throw {
                    message: 'Email ' + user.email + ' already exists',
                    status: 400
                }
            }
        }

        return savedUser;
    }

    async verify(req: any, res: any): Promise<unknown> {
        if (!req.params.code) {
            throw new Error('Invalid code');
        }

        const verification = await AppDataSource.manager.findOne(Verification, {
            where: {
                code: req.params.code
            },
            relations: ['user']
        })

        if (!verification) {
            throw new Error('Invalid code');
        }

        const user = await AppDataSource.manager.findOne(User, {
            where: {
                id: verification.user.id
            }
        })

        if (!user) {
            throw new Error('Invalid code');
        }

        if(verification.type === 'account') {
            user.isVerified = true;
        } else if(verification.type === 'email') {
            user.email = verification.email;
        }

        await AppDataSource.manager.save(user);

        await AppDataSource.manager.remove(verification);

        const token = generateToken(user);

        //set token in cookie
        res.cookie('access_token', token, {httpOnly: false});


        res.writeHead(302, {
            'Location': process.env.FE_URL + '/login'
        });
        res.end();

        return {message: 'Email verified successfully'};
    }

    async resendVerificationEmail(req: any, res: any): Promise<unknown> {
        const email = req.params.email;
        const user = await AppDataSource.manager.findOne(User, {
            where: {
                email: email
            }
        })
        if (!user) {
            throw new Error('Invalid email');
        }
        await sendVerificationEmail(req, user!.email, user!);
        return {message: 'Verification email sent'};
    }

//     get users, also allow filtering by role
    async getUsers(req: any, res: any): Promise<unknown> {
        const schema = Joi
            .object()
            .keys({
                role: Joi.string().optional()
            })
            .unknown(true)
            .required()

        const result = schema
            .validate(req.query);

        if (result.error) {
            throw result.error;
        }

        const query: any = {};

        if (req.query.role) {
            query.role = req.query.role;
        }

        return await AppDataSource.manager.find(User, {
            where: query
        });
    }

    async forgotPassword(req: any, res: any): Promise<unknown> {
        console.log(req.query);
        console.log(req.args)
        console.log(req.body)
        console.log(req.query)
        const schema = Joi
            .object()
            .keys({
                email: Joi.string().required()
            })
            .unknown(true)
            .required()

        const result = schema
            .validate(req.query);

        if (result.error) {
            throw result.error;
        }

        const user = await AppDataSource.manager.findOne(User, {
            where: {
                email: req.query.email
            }
        })

        console.log(".....................usr", user);
        if (!user) {
            throw new Error('Invalid email');
        }

        await sendPasswordResetEmail(req, user.email, user);

        return {message: 'Password reset email sent'};
    }

    async resetPassword(req: any, res: any): Promise<unknown> {
        //     user will send post request {code, user_id, new_password}
        const schema = Joi
            .object()
            .keys({
                code: Joi.string().required(),
                user_id: Joi.number().required(),
                new_password: Joi.string().required()
            })
            .unknown(true)
            .required()

        const result = schema
            .validate(req.body);

        if (result.error) {
            throw result.error;
        }

        const passwordReset = await AppDataSource.manager.findOne(Verification, {
                where: {
                    code: req.body.code,
                }
            }
        )

        if (!passwordReset) {
            throw new Error('Invalid code');
        }

        const user = await AppDataSource.manager.findOne(User, {
            where: {
                id: req.body.user_id
            }
        })

        if (!user) {
            throw new Error('Invalid code');
        }

        user.password = await hashPassword(req.body.new_password);

        await AppDataSource.manager.save(user);

        await AppDataSource.manager.remove(passwordReset);

        return {message: 'Password reset successfully'};

    }

    async getUser(req: any, res: any): Promise<unknown> {
        const user: {
            id: number,
            role: string
        } = req.user


        return this.dataSource.manager.findOne(User, {
            where: {
                id: user.id
            }
        })

    }


    //admin creates user (auto verify)
    async createUser(req: any, res: any): Promise<unknown> {
        const schema = Joi
            .object()
            .keys({
                email: Joi.string().required(),
                password: Joi.string().required(),
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                phone: Joi.string().optional(),
            })
            .unknown(true)
            .required()


        const result = schema
            .validate(req.body);

        if (result.error) {
            throw result.error;
        }

        const user = new User({
            email: req.body.email,
            password: await hashPassword(req.body.password),
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            role: "vendor",
            isVerified: true
        });

        let savedUser;
        try {
            savedUser = await AppDataSource.manager.save(user);
        } catch (err: any) {
            //     check if error is typeorm unique constraint error
            if (err.code === '23505') {
                throw {
                    message: 'Email ' + user.email + ' already exists',
                    status: 400
                }
            }
        }

        return savedUser;
    }

    //update user firstname, lastname
    async updateUser(req: any, res: any): Promise<unknown> {
        const schema = Joi
            .object()
            .keys({
                firstName: Joi.string().optional(),
                lastName: Joi.string().optional(),
            })
            .unknown(true)
            .required()

        const result = schema
            .validate(req.body);

        if (result.error) {
            throw result.error;
        }

        const user = await AppDataSource.manager.findOne(User, {
            where: {
                id: req.user.id
            }
        })

        if (!user) {
            throw new Error('Invalid user');
        }

        if(!req.body.firstName && !req.body.lastName){
            throw new Error('Nothing to update. Please provide firstName or lastName.');
        }
        if (req.body.firstName) {
            user.firstName = req.body.firstName;
        }

        if (req.body.lastName) {
            user.lastName = req.body.lastName;
        }
        await AppDataSource.manager.save(user);

        return {message: 'User updated successfully'};
    }

    //update email
    async updateEmail(req: any, res: any): Promise<unknown> {
        const schema = Joi
            .object()
            .keys({
                email: Joi.string().required(),
            })
            .unknown(true)
            .required()

        const result = schema
            .validate(req.body);

        if (result.error) {
            throw result.error;
        }

        const user = await AppDataSource.manager.findOne(User, {
            where: {
                id: req.user.id
            }
        })

        if (!user) {
            throw new Error('Invalid user');
        }

        let emailExists = await AppDataSource.manager.findOne(User, {
            where: {
                email: req.body.email
            }
        })

        if (emailExists) {
            throw new Error('Email already exists');
        }

        let newEmail = req.body.email;

        if (user.email === newEmail) {
            throw new Error('Email already exists');
        }

        //verify email
        await sendVerificationEmail(req, newEmail, user, true);

        return {message: 'Verification email sent'};

    }


    //update/upload picture
    async updatePicture(req: any, res: any): Promise<unknown> {

        let user = await uploadSinglePicture(req.user.id, User, req.files.picture[0], AppDataSource.manager);

        return {message: 'Picture updated successfully', user: user};
    }
}
