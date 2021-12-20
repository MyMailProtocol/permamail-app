import { render, fireEvent } from '@testing-library/svelte';
import Header from '../lib/header/Header.svelte';

it('it works', async () => {
  const { getByText } = render(Header);

  const logOut = getByText('Log out');

  await fireEvent.click(logOut);

  // with jest-dom
  // expect(counter).toHaveTextContent('2');
})
