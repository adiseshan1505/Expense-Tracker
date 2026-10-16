import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '../api/client';
import { metaApi } from '../api/transactions';
import { ErrorState, Loading } from '../components/States';
import { useAsync } from '../hooks/useAsync';

const MetaContext = createContext(null);

function StartupLoader() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="full-page">
      <Loading
        text={
          slow
            ? 'Starting the server... this can take up to a minute on the first visit (free hosting).'
            : 'Loading...'
        }
      />
    </div>
  );
}

export function MetaProvider({ children }) {
  const { data, error, loading, reload } = useAsync((signal) => metaApi.get(signal), []);

  const value = useMemo(() => {
    if (!data) return null;
    const methodLabels = Object.fromEntries(data.paymentMethods.map((m) => [m.value, m.label]));
    return {
      ...data,
      paymentMethodLabel: (value) => methodLabels[value] ?? value,
      typeLabel: (type) => data.typeLabels[type] ?? type,
    };
  }, [data]);

  if (!value && loading) return <StartupLoader />;
  if (!value) {
    return (
      <div className="full-page">
        <ErrorState message={getErrorMessage(error)} onRetry={reload} />
      </div>
    );
  }

  return <MetaContext.Provider value={value}>{children}</MetaContext.Provider>;
}

export const useMeta = () => useContext(MetaContext);
