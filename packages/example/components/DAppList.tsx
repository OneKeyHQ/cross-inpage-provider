import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardTitle } from './ui/card';

export type Dapp = {
  name: string;
  url: string;
};

export type DappListProps = {
  dapps: Dapp[];
};

const DappList: React.FC<DappListProps> = ({ dapps }) => {
  return (
    <Card>
      <CardTitle className="text-xl">Dapp Bookmarks</CardTitle>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {dapps.map((dapp, index) => (
          <div key={index} className="border p-2 rounded-lg shadow-sm hover:shadow-md">
            <Link href={dapp.url} legacyBehavior>
              <a className="text-blue-500 hover:underline text-lg block">{dapp.name} →</a>
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DappList;
