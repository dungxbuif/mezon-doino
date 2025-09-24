import { Global, Logger, Module, type Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MezonClientService } from '@src/common/shared/services/mezon.service';
import { MezonClient } from 'mezon-sdk';
import { AppConfigService } from './services/app-config.service';
import { GeneratorService } from './services/generator.service';
import { TokenService } from './services/token.service';
import { ValidatorService } from './services/validator.service';

const providers: Provider[] = [
  AppConfigService,
  ValidatorService,
  GeneratorService,
  TokenService,
  {
    provide: 'MEZON_CLIENT',
    useFactory: async (config: AppConfigService) => {
      try {
        const token = config.botToken;
        const client = new MezonClient(token);
        await client.login();
        Logger.log('Mezon client logged in successfully');
        return client;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    inject: [AppConfigService],
  },
  MezonClientService,
];

@Global()
@Module({
  providers,
  imports: [
    JwtModule.register({}),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  exports: [...providers],
})
export class SharedModule {}
