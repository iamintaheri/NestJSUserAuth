import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as config from 'config';
import { User } from './auth/user.entity';

const dbConfig = config.get('db');
@Module({
  imports: [
    MikroOrmModule.forRoot({
      //entities: [User],
      type: process.env.DB_TYPE || dbConfig.type,
      clientUrl: process.env.DB_URL || dbConfig.url,
      autoLoadEntities: true,
      ensureIndexes: true,
      debug: process.env.DB_DEBUG || dbConfig.debug,
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
