import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './presentation/v1/modules/user.module';
import { ItbaModule } from './presentation/v1/modules/itba.module';
import { HealthController } from './presentation/v1/controllers/health.controller';
import { CronService } from './shared/services/cron.service';
import { NewsletterModule } from './presentation/v1/modules/newsletter.module';
import { AuthModule } from './presentation/v1/modules/auth.module';


@Module({
  imports: [
    ScheduleModule.forRoot(),
    UserModule,
    ItbaModule,
    NewsletterModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [CronService],
})
export class AppModule {}
