import {render, screen} from '@testing-library/react';
import App from './App';
test('shows the workspace loading state',()=>{global.fetch=jest.fn(()=>new Promise(()=>{}));render(<App/>);expect(screen.getByText('Preparing your workspace…')).toBeInTheDocument()});
