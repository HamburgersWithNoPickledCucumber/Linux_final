import { useServerData } from '../../hooks/useServerData';
import PluginCard from '../ui/PluginCard';
import DataTable from '../ui/DataTable';
import KeyValueList from '../ui/KeyValueList';

export default function SimplePlugin({ id, config }) {
  const { data, loading } = useServerData(config.moduleName, { poll: false });
  const empty = data && (
    (Array.isArray(data) && data.length === 0) ||
    (!Array.isArray(data) && Object.keys(data).length === 0)
  );

  return (
    <PluginCard id={id} title={config.heading} loading={loading} empty={empty}>
      {config.component === 'dataTable' && data && <DataTable data={data} />}
      {config.component === 'keyValueList' && data && <KeyValueList data={data} />}
    </PluginCard>
  );
}
