import React from 'react';
import styles from '../../styles/Home.module.css';

interface DApp {
  name: string;
  url: string;
}

interface Props {
  dapps: DApp[];
}

function DAppList(props: Props) {
  const { dapps } = props;

  return (
    <div className={styles.container}>
      <h3>Top DApps</h3>
      <ul>
        {dapps.map((dapp) => (
          <li key={dapp.name}>
            <a href={dapp.url} target={'_blank'}>
              {dapp.name} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { DAppList };
