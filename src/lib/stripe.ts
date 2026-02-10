import Stripe from 'stripe';
import { getServerSecrets } from '@/src/lib/env';

export const stripe = new Stripe(getServerSecrets().stripeSecretKey, {
  typescript: true,
});
