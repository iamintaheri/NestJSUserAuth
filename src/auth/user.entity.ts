import { DateTime } from 'luxon';
import * as bcrypt from 'bcrypt';
import * as config from 'config';
import { Exclude, Type, Expose } from 'class-transformer';
import {
  Entity,
  PrimaryKey,
  Property,
  Unique,
  EntityRepositoryType,
} from '@mikro-orm/core';
import { UserRepository } from './user.repository';

const freeDays = config.get('user').days;

@Entity({ collection: 'users', customRepository: () => UserRepository })
@Unique({ properties: ['phone'] })
export class User {
  [EntityRepositoryType]?: UserRepository;

  @Type(() => String)
  @PrimaryKey()
  _id: string;

  @Property()
  name: string;

  @Property()
  phone: string;

  @Exclude({ toPlainOnly: true })
  @Property({ hidden: true })
  password: string;

  @Exclude({ toPlainOnly: true })
  @Property({ hidden: true })
  salt: string;

  @Exclude({ toPlainOnly: true })
  @Property({ hidden: true })
  is_verified = false;

  @Exclude({ toPlainOnly: true })
  @Property({ hidden: true })
  last_sms: Date;

  @Exclude({ toPlainOnly: true })
  @Property({ hidden: true })
  code: number;

  @Exclude({ toPlainOnly: true })
  @Type(() => Date)
  @Property({ hidden: true })
  created_at: DateTime = DateTime.utc();

  @Type(() => Date)
  @Property({ hidden: true })
  @Exclude({ toPlainOnly: true })
  expire: DateTime = DateTime.utc().plus({ days: freeDays });

  @Expose()
  @Property({ persist: false })
  get valid_days(): number {
    const expire = DateTime.fromISO(this.expire.toJSON().replace('Z', ''), {
      zone: 'utc',
    });
    const now = DateTime.utc();
    const { days } = expire.diff(now, 'days').toObject();
    return days > 0 ? parseInt(days) : 0;
  }

  async validatePassword(password): Promise<boolean> {
    const hashedPass = await bcrypt.hash(password, this.salt);
    return this.password === hashedPass;
  }
}
