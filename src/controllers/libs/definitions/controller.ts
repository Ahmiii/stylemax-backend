import * as Joi from "joi";
import {DataSource} from "typeorm";
import {AppDataSource} from "../../../libs/data-source";
import {ERRORS, HttpError} from "../../../libs/utils/errors";

/**
 * Base controller class that handles error handling
 * it proxies all the methods of the class that extends it
 * english: it will catch all the errors thrown by the methods of the class that extends it
 */
export class Controller {

    dataSource: DataSource;

    constructor(dataSource: DataSource = AppDataSource) {
        this.dataSource = dataSource;
        const handler = {
            get: (target: any, prop: any) => {
                if (prop === "handle") {
                    return target[prop];
                }
                return async (req: any, res: any) => {
                    try {
                        req.route = prop;
                        let data = await target[prop](req, res);
                        //if response is not sent, send 200
                        if (!res.headersSent) {
                            res.status(data.status ?? 200).send(
                                data
                            );
                        }

                    } catch (e) {
                        console.log("Error in controller: " + this.constructor.name);
                        console.log("Thrown by: " + prop)
                        console.log(e);
                        //@ts-ignore
                        let errorObj: HttpError = e;
                        if (e instanceof Joi.ValidationError) {
                            errorObj = {
                                status: 400,
                                message: e.details[0].message
                            }
                        } else if ((e as any)?.code === "23505") {
                            const duplicateColumn = (e as any).detail.match(/\((.*?)\)/)[1];
                            //QueryFailedError: duplicate key value violates unique constraint "UQ_ffd5db90bbc6a237ef6d390e668"
                            //     at PostgresQueryRunner.query (D:\codes\work\stylemax_backend\src\driver\postgres\PostgresQueryRunner.ts:299:19)
                            //     at processTicksAndRejections (node:internal/process/task_queues:96:5)
                            //     at InsertQueryBuilder.execute (D:\codes\work\stylemax_backend\src\query-builder\InsertQueryBuilder.ts:163:33)
                            //     at SubjectExecutor.executeInsertOperations (D:\codes\work\stylemax_backend\src\persistence\SubjectExecutor.ts:428:42)
                            //     at SubjectExecutor.execute (D:\codes\work\stylemax_backend\src\persistence\SubjectExecutor.ts:137:9)
                            //     at EntityPersistExecutor.execute (D:\codes\work\stylemax_backend\src\persistence\EntityPersistExecutor.ts:197:21) {
                            //   query: 'INSERT INTO "category"("label", "description", "picture") VALUES ($1, $2, DEFAULT) RETURNING "id", "picture"',
                            //   parameters: [ 'lable13ws3d', 'desc' ],
                            //   driverError: error: duplicate key value violates unique constraint "UQ_ffd5db90bbc6a237ef6d390e668"
                            //       at Parser.parseErrorMessage (D:\codes\work\stylemax_backend\node_modules\pg-protocol\src\parser.ts:369:69)
                            //       at Parser.handlePacket (D:\codes\work\stylemax_backend\node_modules\pg-protocol\src\parser.ts:188:21)
                            //       at Parser.parse (D:\codes\work\stylemax_backend\node_modules\pg-protocol\src\parser.ts:103:30)
                            //       at Socket.<anonymous> (D:\codes\work\stylemax_backend\node_modules\pg-protocol\src\index.ts:7:48)
                            //       at Socket.emit (node:events:513:28)
                            //       at addChunk (node:internal/streams/readable:315:12)
                            //       at readableAddChunk (node:internal/streams/readable:289:9)
                            //       at Socket.Readable.push (node:internal/streams/readable:228:10)
                            //       at TCP.onStreamRead (node:internal/stream_base_commons:190:23) {
                            //     length: 236,
                            //     severity: 'ERROR',
                            //     code: '23505',
                            //     detail: 'Key (label)=(lable13ws3d) already exists.',
                            //     hint: undefined,
                            //     position: undefined,
                            //     internalPosition: undefined,
                            //     internalQuery: undefined,
                            //     where: undefined,
                            //     schema: 'public',
                            //     table: 'category',
                            //     column: undefined,
                            //     dataType: undefined,
                            //     constraint: 'UQ_ffd5db90bbc6a237ef6d390e668',
                            //     file: 'nbtinsert.c',
                            //     line: '663',
                            //     routine: '_bt_check_unique'
                            //   },
                            //   length: 236,
                            //   severity: 'ERROR',
                            //   code: '23505',
                            //   detail: 'Key (label)=(lable13ws3d) already exists.',
                            //   hint: undefined,
                            //   position: undefined,
                            //   internalPosition: undefined,
                            //   internalQuery: undefined,
                            //   where: undefined,
                            //   schema: 'public',
                            //   table: 'category',
                            //   column: undefined,
                            //   dataType: undefined,
                            //   constraint: 'UQ_ffd5db90bbc6a237ef6d390e668',
                            //   file: 'nbtinsert.c',
                            //   line: '663',
                            //   routine: '_bt_check_unique'
                            // }
                            const entity = (e as any).table;

                            errorObj = ERRORS.duplicateEntry({
                                duplicate_field: duplicateColumn,
                                entity: entity
                            });
                        } else if (e instanceof Error) {
                            errorObj = {
                                status: 500,
                                message: e.message
                            }
                        } else if (!errorObj) {
                            errorObj = {
                                status: 500,
                                message: "Internal server error"
                            }
                            return res.status(errorObj.status ?? 500).send(errorObj.message);
                        }
                        res.status(errorObj.status ?? 500).send(errorObj.message);
                    }
                }
            }
        }
        return new Proxy(this, handler);
    }
}
