import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Logger } from '@config/logger.config';
import axios from 'axios';

import { ChannelController, ChannelControllerInterface } from '../channel.controller';

export class MetaController extends ChannelController implements ChannelControllerInterface {
  private readonly logger = new Logger('MetaController');

  constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService) {
    super(prismaRepository, waMonitor);
  }

  integrationEnabled: boolean;

  public async receiveWebhook(data: any) {
    try {
      this.logger.info('VALOR DE DATA META: ' + JSON.stringify(data));
    } catch (error: any) {
      this.logger.error('=== ERRO NO LOG ===' + error.message);
      this.logger.info('VALOR DE DATA META (sem stringify): ' + data);
    }
    if (data.object === 'whatsapp_business_account') {
      if (data.entry[0]?.changes[0]?.field === 'message_template_status_update') {
        const wabaId = data.entry[0]?.id;
        if (!wabaId) {
          this.logger.error('WebhookService -> receiveWebhookMeta -> wabaId not found');
          return;
        }
        const instance = await this.prismaRepository.instance.findFirst({
          where: { name: wabaId },
        });

        if (!instance) {
          this.logger.error('WebhookService -> receiveWebhookMeta -> instance not found: ' + wabaId);
          return;
        }

        await this.waMonitor.waInstances[instance.name].connectToWhatsapp(data);
        return;
      }

      if (data.entry[0]?.changes[0]?.field === 'account_update') {
        const wabaId = data.entry[0]?.changes[0]?.value?.waba_info?.waba_id;
        if (!wabaId) {
          this.logger.error('[account_update] WebhookService -> receiveWebhookMeta -> wabaId not found');
          return;
        }
        const instance = await this.prismaRepository.instance.findFirst({
          where: { name: wabaId },
        });

        if (!instance) {
          this.logger.error('WebhookService -> receiveWebhookMeta -> instance not found');
          return;
        }

        await this.waMonitor.waInstances[instance.name].connectToWhatsapp(data);
        return;
      } else if (data.entry[0]?.changes[0]?.field === 'calls') {
        const wabaId = data.entry[0]?.id;
        if (!wabaId) {
          this.logger.error('[Calls] WebhookService -> receiveWebhookMeta -> wabaId not found');
          return;
        }
        const instance = await this.prismaRepository.instance.findFirst({
          where: { name: wabaId },
        });

        if (!instance) {
          this.logger.error('WebhookService -> receiveWebhookMeta -> instance not found');
          return;
        }

        await this.waMonitor.waInstances[instance.name].connectToWhatsapp(data);
        return;
      }

      data.entry?.forEach(async (entry: any) => {
        const numberId = entry.changes[0].value.metadata.phone_number_id;

        if (!numberId) {
          this.logger.error('WebhookService -> receiveWebhookMeta -> numberId not found');
          return {
            status: 'success',
          };
        }

        const instance = await this.prismaRepository.instance.findFirst({
          where: { number: numberId },
        });

        if (!instance) {
          this.logger.error('WebhookService -> receiveWebhookMeta -> instance not found');
          return {
            status: 'success',
          };
        }

        await this.waMonitor.waInstances[instance.name].connectToWhatsapp(data);

        return {
          status: 'success',
        };
      });
    }

    return {
      status: 'success',
    };
  }
}
