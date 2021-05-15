import { TableRow } from '../../../types/table';
import { stringSortFn, dateSortFn } from '../../../helpers/utils';

interface CustomerHeaders extends TableRow {
  name: CustomerColumns;
  field: CustomerColumns;
}

enum CustomerColumns {
  id = 'id',
  first_name = 'first_name',
  last_name = 'last_name',
  email = 'email',
  phone_number = 'phone_number',
  is_corporate = 'is_corporate',
  created_at = 'created_at',
  updated_at = 'updated_at',
}

const columns: Array<CustomerHeaders> = [
  {
    name: CustomerColumns.id,
    required: false,
    label: 'Customer ID',
    align: 'center',
    field: CustomerColumns.id,
  },
  {
    name: CustomerColumns.first_name,
    required: true,
    label: 'First Name',
    align: 'center',
    field: CustomerColumns.first_name,
    sortable: true,
    sort: (a: string, b: string) => stringSortFn(a, b),
  },
  {
    name: CustomerColumns.last_name,
    required: true,
    label: 'Last Name',
    align: 'center',
    field: CustomerColumns.last_name,
    sortable: true,
    sort: (a: string, b: string) => stringSortFn(a, b),
  },
  {
    name: CustomerColumns.email,
    required: true,
    label: 'Email Address',
    align: 'center',
    field: CustomerColumns.email,
    sortable: true,
    sort: (a: string, b: string) => stringSortFn(a, b),
  },
  {
    name: CustomerColumns.phone_number,
    required: true,
    label: 'Phone Number',
    align: 'center',
    field: CustomerColumns.phone_number,
    sortable: true,
    sort: (a: string, b: string) => stringSortFn(a, b),
  },
  {
    name: CustomerColumns.is_corporate,
    required: true,
    label: 'Is Corporate Customer',
    align: 'center',
    field: CustomerColumns.is_corporate,
    sortable: true,
  },
  {
    name: CustomerColumns.created_at,
    required: false,
    label: 'Created At',
    align: 'center',
    field: CustomerColumns.created_at,
    sortable: true,
    sort: (a: string, b: string) => dateSortFn(a, b),
  },
  {
    name: CustomerColumns.updated_at,
    required: false,
    label: 'Updated At',
    align: 'center',
    field: CustomerColumns.updated_at,
    sortable: true,
    sort: (a: string, b: string) => dateSortFn(a, b),
  },
];

export default columns;
