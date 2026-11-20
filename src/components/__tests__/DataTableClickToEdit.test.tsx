import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from '../DataTable';

// DataTable reads matchMedia for its mobile view; jsdom does not provide it.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  }),
});

type Row = { id: string; name: string };
const rows: Row[] = [
  { id: 'a', name: 'Quote history import' },
  { id: 'b', name: 'Standup' },
];

const renderTable = (triggerOnClick: boolean) =>
  render(
    <DataTable<Row>
      data={rows}
      columns={[{ key: 'name', header: 'Name' }]}
      selectable
      selectedRows={new Set()}
      onRowSelect={() => {}}
      expandedRowConfig={{
        edit: {
          triggerOnClick,
          render: (row) => <div>{`Editing ${row.name}`}</div>,
        },
      }}
    />,
  );

describe('DataTable edit.triggerOnClick', () => {
  it('opens the editor on a single click of the row', () => {
    renderTable(true);
    fireEvent.click(screen.getByText('Quote history import'));
    expect(screen.getByText('Editing Quote history import')).toBeInTheDocument();
  });

  it('does not open the editor when the selection checkbox is clicked', () => {
    renderTable(true);
    fireEvent.click(screen.getByLabelText('Select row a'));
    expect(screen.queryByText('Editing Quote history import')).not.toBeInTheDocument();
  });

  it('does not close the open editor on a second click of its row', () => {
    renderTable(true);
    fireEvent.click(screen.getByText('Quote history import'));
    fireEvent.click(screen.getByText('Quote history import'));
    expect(screen.getByText('Editing Quote history import')).toBeInTheDocument();
  });

  it('moves the editor to another row when that row is clicked', () => {
    renderTable(true);
    fireEvent.click(screen.getByText('Quote history import'));
    fireEvent.click(screen.getByText('Standup'));
    expect(screen.getByText('Editing Standup')).toBeInTheDocument();
    expect(screen.queryByText('Editing Quote history import')).not.toBeInTheDocument();
  });

  it('leaves a single click alone without the option, as before', () => {
    renderTable(false);
    fireEvent.click(screen.getByText('Quote history import'));
    expect(screen.queryByText('Editing Quote history import')).not.toBeInTheDocument();
    fireEvent.doubleClick(screen.getByText('Quote history import'));
    expect(screen.getByText('Editing Quote history import')).toBeInTheDocument();
  });
});
