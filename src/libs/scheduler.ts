//scheduler with node-schedule to run every 10 minutes
import * as schedule from "node-schedule";
import { AppDataSource } from "./data-source";
import { NewOrder } from "../entity/Product";
import { LessThanOrEqual } from "typeorm";

export function catchAsync(fn: () => Promise<any>) {
    return function () {
        fn().catch(
            (err: Error) => {
                console.error(err);
            }
        );
    };
}
export class Scheduler {
    private static instance: Scheduler;
    private job: schedule.Job;

    private constructor(task: () => Promise<any>) {
        this.job = schedule.scheduleJob(
            // run every 3 seconds
            "*/9 * * * * *",
            // "24 7 * * *",
            // use catchAsync pattern to wrap the task
            // so that the task will not crash the scheduler

            catchAsync(
                    task
                )

        );
    }

    public static createInstance(task: () => Promise<any>): Scheduler {
        if (!Scheduler.instance) {
            Scheduler.instance = new Scheduler(task);
        }
        return Scheduler.instance;
    }
}
export async function myScheduledTask() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const ordersToUpdate = await AppDataSource.manager.find(NewOrder, {
        where: {
            order_status: "delivered",
            //  deliveredAt: LessThanOrEqual(threeDaysAgo),
            
        },
    });
    for (const order of ordersToUpdate) {
        order.order_status = "completed";
        
    }
    await AppDataSource.manager.save(ordersToUpdate);
    


  }
export function initializeScheduler(){
    Scheduler.createInstance(myScheduledTask);
}