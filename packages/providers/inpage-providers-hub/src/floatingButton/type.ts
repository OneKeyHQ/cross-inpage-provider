
export enum EHostSecurityLevel {
  High = 'high',
  Medium = 'medium',
  Security = 'security',
  Unknown = 'unknown',
}
export interface IAttackType {
  name: string;
  description: string;
}

export interface IHostSecurityCheckSources {
  name: string;
  riskLevel: EHostSecurityLevel;
}

export interface IHostSecurity {
  host: string;
  level: EHostSecurityLevel;
  attackTypes: IAttackType[];
  phishingSite: boolean;
  checkSources: IHostSecurityCheckSources[];
  alert: string;
  detail?: {
    title: string;
    content: string;
  };
  projectName: string;
  createdAt: string;
  updatedAt?: string;
  dapp?: {
    name: string;
    logo: string;
    description: {
      text: string;
    };
    tags: {
      name: {
        text: string;
        lokaliseKey: string;
        deleted: boolean;
      };
      tagId: string;
      type: 'success' | 'info' | 'critical' | 'warning' | 'default' | undefined;
    }[];
    origins: {
      name: string;
      logo: string;
    }[];
  };
}