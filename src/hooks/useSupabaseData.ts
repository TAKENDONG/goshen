import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useSupabaseData<T>(
  table: string,
  selectQuery: string = '*',
  dependencies: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    fetchData();
  }, [user, table, selectQuery, ...dependencies]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: result, error: fetchError } = await supabase
        .from(table)
        .select(selectQuery)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setData(result || []);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const insert = async (values: Partial<T>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { data: result, error: insertError } = await supabase
        .from(table)
        .insert(values)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      await fetchData(); // Refresh data
      return { data: result, error: null };
    } catch (err) {
      console.error(`Error inserting to ${table}:`, err);
      return { data: null, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const update = async (id: string, values: Partial<T>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { data: result, error: updateError } = await supabase
        .from(table)
        .update(values)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      await fetchData(); // Refresh data
      return { data: result, error: null };
    } catch (err) {
      console.error(`Error updating ${table}:`, err);
      return { data: null, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const remove = async (id: string) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      await fetchData(); // Refresh data
      return { error: null };
    } catch (err) {
      console.error(`Error deleting from ${table}:`, err);
      return { error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    insert,
    update,
    remove
  };
}