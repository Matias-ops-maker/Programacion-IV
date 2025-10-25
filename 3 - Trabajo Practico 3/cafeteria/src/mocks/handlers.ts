import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/menu', () => {
    return HttpResponse.json([
      { id: 1, name: 'Café', price: 500 },
      { id: 2, name: 'Medialuna', price: 300 },
    ])
  }),

  http.get('/api/orders', () => {
    return HttpResponse.json([
      { id: 101, items: ['Café'], total: 500 },
    ])
  }),
]
