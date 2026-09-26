import { supabase } from './supabase'

/** The three finance tables that hold manually-entered rows. */
export type FinanceTableName = 'revenue_entries' | 'tax_stays' | 'misc_entries'

/**
 * Deletes a single finance row.
 *
 * Shared by the three finance modals and by the per-row "Supprimer" button in
 * FinanceTable, so the deletion lives in one place. Returns false on failure:
 * the Supabase client returns { error } instead of throwing, so callers must
 * check the result and show a French message themselves.
 */
export async function deleteFinanceEntry(
  table: FinanceTableName,
  id: string,
): Promise<boolean> {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) {
    console.error(`Finance entry delete error (${table}):`, error)
    return false
  }
  return true
}
