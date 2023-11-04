import * as Joi from "joi";
import {ERRORS} from "../../libs/utils/errors";

export function validateQueryOrderingParams(query: any) {
    const schema = Joi
        .object()
        .keys({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            sort: Joi.string().default("id"),
            order: Joi.string().default("DESC"),
            sort_type: Joi.string().valid('price_asc', 'price_desc', 'date_asc', 'date_desc').default('none'),
        })
        .unknown(true)
        .required()
    const result = schema
        .validate(query);
    if (result.error) {
        throw  ERRORS.invalidParams({
            message: result.error.message
        });
    }
    return result.value;
}
