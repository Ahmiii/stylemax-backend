import * as bcrypt from "bcrypt";
import {sign, verify} from "jsonwebtoken";
import {BlogContentData, BlogContentItem} from "../types";
import {ERRORS} from "./errors";

export async function hashPassword(myPlaintextPassword: string): Promise<string> {
    const saltRounds = 10;

    const salt = bcrypt.genSaltSync(saltRounds);
    return bcrypt.hash(myPlaintextPassword, salt);
}

export async function comparePassword(myPlaintextPassword: string, hash: string): Promise<boolean> {
    console.log({myPlaintextPassword})
    return bcrypt.compare(myPlaintextPassword, hash);
}

export function generateToken(data: any): string {
    data = JSON.parse(JSON.stringify(data)); //remove all functions, make it pure json
    return sign(data, process.env.JWT_SECRET as string);
}

export async function verifyToken(token: string): Promise<any> {
    return verify(token, process.env.JWT_SECRET as string);
}


export function setToken(user: {
    id: any;
    email: any;
    role: any;
    password?: any;
}, res: any) {
    if (user.password) {
        user.password = undefined;
    }
    const token = generateToken(user);
    //set token in cookie
    res.cookie('access_token', token, {httpOnly: false, path: '/'});
    //@ts-ignore
    user.access_token = token;
    return token;
}
//
export function validateBlogContentData(item: BlogContentItem) {
        switch (item.type) {
            case "text":
                if (!item.data.text) throw ERRORS.invalidParams(
                    {
                        message: "text is required"
                    }
                );
                break;
            case "image":
                if (!item.data.file) throw ERRORS.invalidParams(
                    {
                        message: "image file is required"
                    }
                );
                break;
            case "link":
                if (!item.data.link) throw ERRORS.invalidParams(
                    {
                        message: "link is required"
                    }
                );
                break;
            case "quote":
                if (!item.data.text) throw ERRORS.invalidParams(
                    {
                        message: "quote text is required"
                    }
                );
                break;
            case "code":
                if (!item.data.code) throw ERRORS.invalidParams(
                    {
                        message: "Add some code to the code block"
                    }
                );
                break;
            case "table":
                if (!item.data.content) throw ERRORS.invalidParams(
                    {
                        message: "table content is required"
                    }
                );
                break;
            case "paragraph":
                if (!item.data.text) throw ERRORS.invalidParams(
                    {
                        message: "paragraph text is required"
                    }
                );
                break;
            case "header":
                if (!item.data.text) throw ERRORS.invalidParams(
                    {
                        message: "header text is required"
                    }
                );
                if (!item.data.level) throw ERRORS.invalidParams(
                    {
                        message: "header level is required (1 for h1, 2 for h2, etc.)"
                    }
                );
                break;
            default:
                throw ERRORS.invalidParams(
                    {
                        message: "Invalid type"
                    }
                );
        }
}
