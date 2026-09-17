import { closeMailTmContext } from '../utils/mailtm';

export default async function globalTeardown() {
  await closeMailTmContext();
}