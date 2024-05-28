export type IApiContainerProps = {
  title: string;
  children?: React.ReactNode;
};

export function ApiGroup({ title, children }: IApiContainerProps) {
  return (
    <div>
      <h2 className="text-2xl font-medium mt-4 mb-2">{title}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  );
}
