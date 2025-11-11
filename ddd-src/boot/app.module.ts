import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ItbaModule } from './modules/itba.module';
import { HealthController } from '@career/web/controllers/health.controller';
import { CronService } from '../contexts/career/application/schedulers/cron.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ItbaModule,
  ],
  controllers: [HealthController],
  providers: [CronService],
})
export class AppModule {}
