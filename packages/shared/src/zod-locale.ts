import { z } from 'zod'

// Validierungsmeldungen von zod auf Deutsch – gilt für API, Web, Extension und Add-in.
z.config(z.locales.de())
