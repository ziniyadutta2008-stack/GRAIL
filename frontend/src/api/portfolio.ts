import { useQuery } from '@tanstack/react-query'

import * as demo from '../demo/demoData'

/**
 * Portfolio server state. Stage 1 resolves synthetic seed data; Stage 2 replaces the
 * query function with apiRequest('/v1/...') without changing any screen.
 */
export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio', demo.DATA_AS_OF],
    queryFn: async () => demo,
    staleTime: Infinity,
  })
}
