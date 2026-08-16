ALTER TABLE "habit" ADD COLUMN "task_id" text;
ALTER TABLE "habit" ADD COLUMN "project_id" text;
ALTER TABLE "habit" ADD COLUMN "goal_id" text;

ALTER TABLE "habit" ADD CONSTRAINT "habit_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "habit" ADD CONSTRAINT "habit_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "habit" ADD CONSTRAINT "habit_goal_id_goal_id_fk" FOREIGN KEY ("goal_id") REFERENCES "goal"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
