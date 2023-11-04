export type HttpError = {
    status: number;
    message: string;
}

export class ERRORS {

    static VendorAlreadyExists(): HttpError {
        return {
            status: 400,
            message: "Vendor already exists"
        }
    }

    static UserAlreadyExists(): HttpError {
        return {
            status: 400,
            message: "User already exists"
        }
    }

    static InvalidEmailOrPassword(): HttpError {
        return {
            status: 400,
            message: "Invalid email or password"
        }
    }

    static InvalidEmail(): HttpError {
        return {
            status: 400,
            message: "Invalid email"
        }
    }

    //create a user before creating a vendor
    static UserNotFound(): HttpError {
        return {
            status: 400,
            message: "Please login or create a user account first."
        }
    }

    static invalidParams(
        validationErrors: { [key: string]: string }|string|{
            message: string;
        }[] = {}
    ): HttpError {
    //     helpful message using validationErrors
        return {
            status: 400,
            message: this.composeErrorMessage('Invalid Parameters!', validationErrors)
        }
    }

    static BlogNotFound() {
        return {
            status: 400,
            message: "Blog not found"
        }
    }

    static UserNotAuthorized() {
        return {
            status: 403,
            message: "User not authorized"
        }
    }

    static BlogContentNotFound() {
        return {
            status: 400,
            message: "Blog content not found"
        }
    }

    private static composeErrorMessage(message: string, validationErrors: { [key: string]: string }|string|{
        message: string;
    }[]): string {
        // let errorMessage = message;
        // Object.keys(validationErrors).forEach((key) => {
        //     errorMessage += ` ${validationErrors[key]}`;
        // });
        // return errorMessage;
        if (typeof validationErrors === 'string') {
            return validationErrors;
        }
        if (Array.isArray(validationErrors)) {
            return validationErrors.map((error) => error.message).join(' ');
        }
        return Object.values(validationErrors).join(' ');
    }

    static BannerNotFound() {
        return {
            status: 400,
            message: "Banner not found"
        }
    }

    static notFound(productNotFound: string) {
        //if productNotFound is given, but is a single WORD, assume it to be an entity (like Product, Category etc)
        if(productNotFound && productNotFound.split(" ").length === 1){
            productNotFound = `${productNotFound} not found`
        }
        return {
            status: 404,
            message: productNotFound ?? "Something not found. Please try again."
        }
    }

    static duplicateEntry = ({
        duplicate_field,
        entity
                             }:{
        duplicate_field?: string;
        entity?: string;
    }) => {
        let message = "Duplicates not allowed"
        if(duplicate_field){
            message += ` for ${duplicate_field}`
        }
        if(entity){
            message += ` in ${entity}`
        }
        return {
            status: 400,
            message
        }

    }
}
