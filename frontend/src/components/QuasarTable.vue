<!-- eslint-disable vue/no-v-html -->
<!-- eslint-disable vue/no-v-model-argument -->
<template>
  <div :class="{ 'q-pa-md': !embedMode }">
    <q-table
      v-model:selected="selectedRows"
      v-model:pagination="paginationModel"
      :grid="gridMode"
      :grid-header="gridHeader"
      :hide-pagination="!usePagination"
      :rows="tableDataRows"
      :columns="columns"
      :row-key="rowKey"
      :selection="showSelections ? 'multiple' : 'none'"
      :class="{
        'my-sticky-header-column-table': stickyTable,
        'no-border no-box-shadow': !useTableBox,
      }"
      :card-class="gridCardClass"
      :visible-columns="visibleColumns"
      :loading="loading"
      :filter="filter"
      binary-state-sort
      :hide-no-data="false"
      :no-data-label="noResultsLabel_"
      :no-results-label="noResultsLabel_"
      :rows-per-page-options="rosPerPageOptions"
      :dense="$q.screen.lt.md"
      @request="processTableRequest"
    >
      <template #top="props">
        <div v-if="useMultiFilter" class="col-12 q-mt-md">
          <q-expansion-item
            v-model="filterPanelExpanded"
            icon="tune"
            label="Filters"
          >
            <q-card>
              <q-card-section>
                <div class="q-gutter-md row items-start">
                  <template v-for="column in filterableColumns">
                    <q-input
                      v-if="column.filterInputType === 'text'"
                      :key="'filter_text_input_' + column.name"
                      v-model="filterForm[column.name]"
                      :label="column.label"
                      dense
                      class="q-mb-md"
                      clearable
                    >
                    </q-input>
                    <q-select
                      v-else-if="column.filterInputType === 'select'"
                      :key="'filter_select_input_' + column.name"
                      v-model="filterForm[column.name]"
                      :options="column?.filterOptions ?? []"
                      :label="column.label"
                      options-dense
                      dense
                      use-input
                      emit-value
                      map-options
                      class="q-mb-md"
                      transition-show="scale"
                      transition-hide="scale"
                    >
                    </q-select>
                    <q-input
                      v-else
                      :key="'filter_date_input_' + column.name"
                      v-model="filterForm[column.name]"
                      type="date"
                      :label="column.label"
                      stack-label
                      dense
                    />
                  </template>
                </div>
                <q-btn
                  type="submit"
                  :loading="filterSubmitting"
                  label="Submit"
                  class="q-mt-md"
                  icon-right="send"
                  @click.prevent="submitFilter"
                >
                  <!-- eslint-disable-next-line vue/v-slot-style -->
                  <template #loading>
                    <q-spinner-facebook color="white" />
                  </template>
                </q-btn>
                <q-btn
                  type="submit"
                  label="Clear All"
                  class="q-mt-md q-ml-md"
                  color="warning"
                  @click.prevent="clearFilter"
                >
                </q-btn>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </div>

        <q-input
          v-if="useClientFilterAndPagination"
          v-model="filter"
          dense
          debounce="300"
          placeholder="Search"
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>

        <div class="col-12 row items-start">
          <div class="q-mt-md col col-md-3 col-sm-12 col-xs-12">
            <div v-if="usePagination" class="inline-block">
              {{
                paginationModel.rowsNumber > 1
                  ? `${paginationModel.rowsNumber} records were found`
                  : paginationModel.rowsNumber === 1
                  ? `${paginationModel.rowsNumber} record was found`
                  : 'No record was found'
              }}
            </div>
            <div v-else class="inline-block">
              {{
                clientSidePagination.total > 1
                  ? `${clientSidePagination.total} records were found`
                  : clientSidePagination.total === 1
                  ? `${clientSidePagination.total} record was found`
                  : 'No record was found'
              }}
            </div>

            <slot name="topAddNew" v-bind="{ fetch: fetchTableData }">
              <q-btn
                v-if="
                  showNewRouteButton &&
                  newRouteObject &&
                  newRouteObject.routeName &&
                  resourcePermissions.canCreate
                "
                class="q-ml-lg"
                :to="{
                  name: newRouteObject.routeName,
                }"
                flat
                round
                :icon="newRouteObject.icon"
                :title="newRouteObject.title"
              />
            </slot>
          </div>

          <q-space />

          <div class="col col-sm-12 col-xs-12 col-md-4 col-lg-4">
            <div class="row justify-end">
              <q-select
                v-if="useVisibleColumns && !!invisibleColumnsObjects.length"
                v-model="visibleColumns"
                multiple
                dense
                options-dense
                display-value="Extra columns"
                emit-value
                map-options
                :options="invisibleColumnsObjects"
                option-value="name"
                options-cover
                style="min-width: 200px"
              />

              <q-btn
                v-if="!embedMode"
                flat
                round
                dense
                :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
                class="q-ml-md"
                @click="props.toggleFullscreen"
              />
            </div>
          </div>
        </div>
      </template>

      <template v-if="gridMode" #item="props">
        <slot
          name="gridModeItems"
          v-bind="{
            props,
            fetch: fetchTableData,
            showSelections,
            showActions: showActions_,
            resourcePermissions,
            routeParam,
            rowViewRouteName,
            rowEditRouteName,
            deleteRow,
          }"
        >
        </slot>
      </template>

      <template #header="props">
        <q-tr :props="props">
          <q-th v-if="showExpandedRow" auto-width />
          <q-th v-if="showSelections" auto-width>
            <q-checkbox v-model="props.selected" />
          </q-th>
          <q-th v-for="col in props.cols" :key="col.name" :props="props">
            {{ col.label }}
          </q-th>
          <q-th v-if="showActions_" auto-width> Actions </q-th>
        </q-tr>
      </template>

      <template #body="props">
        <slot
          name="tableRow"
          v-bind="{
            props,
            showSelections,
            showExpandedRow,
            showActions: showActions_,
            resourcePermissions,
            routeParam,
            rowViewRouteName,
            rowEditRouteName,
            deleteRow,
          }"
        >
          <q-tr :props="props">
            <!-- Show expanded row toggle starts -->
            <q-td v-if="showExpandedRow" auto-width>
              <q-btn
                size="sm"
                color="accent"
                round
                dense
                :icon="props.expand ? 'remove' : 'add'"
                @click="props.expand = !props.expand"
              />
            </q-td>
            <!-- Show expanded row toggle ends-->
            <!-- Show selection checkbox starts -->
            <q-td v-if="showSelections" auto-width>
              <q-checkbox v-model="props.selected" />
            </q-td>
            <!-- Show selection checkbox ends -->
            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              <template v-if="col.name === 'display_image'">
                <q-avatar v-if="col.value">
                  <img :src="col.value" />
                </q-avatar>
                <q-avatar v-else color="accent" text-color="white"
                  >AIS</q-avatar
                >
              </template>
              <template v-else>
                {{ col.value }}
              </template>
            </q-td>
            <q-td v-if="showActions_">
              <q-btn-dropdown
                flat
                ripple
                auto-close
                unelevated
                color="accent"
                label="Actions"
              >
                <q-list>
                  <q-item
                    v-if="resourcePermissions?.canView ?? false"
                    v-close-popup
                    clickable
                    :to="{
                      name: rowViewRouteName,
                      params: { [routeParam]: props.row.id },
                    }"
                  >
                    <q-item-section avatar>
                      <q-icon name="remove_red_eye" size="md" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>View</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    v-if="resourcePermissions?.canEdit ?? false"
                    v-close-popup
                    clickable
                    :to="{
                      name: rowEditRouteName,
                      params: { [routeParam]: props.row.id },
                    }"
                  >
                    <q-item-section avatar>
                      <q-icon size="md" name="edit" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Edit</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    v-if="resourcePermissions?.canDelete ?? false"
                    v-close-popup
                    clickable
                    @click="deleteRow(props.row.id)"
                  >
                    <q-item-section avatar>
                      <q-icon size="md" name="delete_forever" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Delete</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="info" color="amber" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </q-td>
          </q-tr>
        </slot>

        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <div class="text-left">
              <q-list bordered separator>
                <q-item v-for="(v, k) in props.row" :key="k" v-ripple clickable>
                  <q-item-section>
                    <q-item-label overline>{{ k }}</q-item-label>
                    <q-item-label>{{ v }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<!-- eslint-disable @typescript-eslint/no-unsafe-return -->
<!-- eslint-disable @typescript-eslint/no-unsafe-member-access -->
<!-- eslint-disable @typescript-eslint/restrict-template-expressions -->
<!-- eslint-disable  @typescript-eslint/no-unsafe-assignment -->
<script lang="ts">
import {
  defineComponent,
  reactive,
  ref,
  computed,
  onBeforeUnmount,
  nextTick,
  Ref,
  onMounted,
  watch,
  readonly,
  PropType,
} from 'vue';
import { useStore } from 'vuex';
import {
  TableRow,
  GenericTableData,
  TableRequestInterface,
  PropObject,
  FetchTableDataInterface,
} from '../types/table';
import { useQuasar } from 'quasar';
import { ResponseData } from '../store/types';
import { useRouter, useRoute } from 'vue-router';
import useResourcePermissions from '../composables/useResourcePermissions';
import { isEmpty } from '../helpers/utils';
import { emitter } from '../boot/EventBus';

export default defineComponent({
  name: 'QuasarTable',

  props: {
    tableColumns: {
      type: Array as PropType<TableRow[]>,
      required: true,
    },
    showSelections: {
      type: Boolean,
      default: false,
    },
    showExpandedRow: {
      type: Boolean,
      default: false,
    },
    gridMode: {
      type: Boolean,
      default: false,
    },
    gridHeader: {
      type: Boolean,
      default: false,
    },
    gridCardClass: {
      type: [String, Array, Object],
      default: () => '',
    },
    useTableBox: {
      type: Boolean,
      default: true,
    },
    embedMode: {
      type: Boolean,
      default: false,
    },
    useMultiFilter: {
      type: Boolean,
      default: true,
    },
    usePagination: {
      type: Boolean,
      default: true,
    },
    useClientFilterAndPagination: {
      type: Boolean,
      default: false,
    },
    useVisibleColumns: {
      type: Boolean,
      default: true,
    },
    showActions: {
      type: Boolean,
      default: true,
    },
    tableName: {
      type: String,
      required: true,
    },
    tableDataFetchEndPoint: {
      type: String,
      required: true,
    },
    rowViewRouteName: {
      type: String,
      required: false,
      default: '',
    },
    rowEditRouteName: {
      type: String,
      required: false,
      default: '',
    },
    rowDeleteActionType: {
      type: String,
      required: false,
      default: '',
    },
    entityName: {
      type: String,
      required: false,
      default: 'Resource',
    },
    rowKey: {
      type: String,
      default: 'id',
    },
    noResultsLabel: {
      type: String,
      required: true,
    },
    tableDataGetterType: {
      type: String,
      required: false,
      default: '',
    },
    routeParam: {
      type: String,
      required: false,
      default: '',
    },
    defaultSort: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    newRouteObject: {
      type: Object,
      required: false,
      default: () => {
        return {};
      },
      validator: (value: PropObject) => {
        if (isEmpty(value)) return true;
        return ['routeName', 'icon', 'title'].every((prop) =>
          Object.prototype.hasOwnProperty.call(value, prop)
        );
      },
    },
    resourceActionPermissions: {
      type: Object,
      required: true,
      validator: (value: PropObject) => {
        return ['new', 'view', 'edit', 'delete'].every((prop) =>
          Object.prototype.hasOwnProperty.call(value, prop)
        );
      },
    },
    isCompanySpecific: {
      type: Boolean,
      default: false,
    },
    showNewRouteButton: {
      type: Boolean,
      default: false,
    },
    rosPerPageOptions: {
      type: Array,
      default: () => [5, 10, 15, 20, 30, 50, 100],
    },
    selectionActions: {
      type: Array,
      required: false,
      default: () => [],
    },
    extraQueryStrings: {
      type: Object,
      required: false,
      default: () => ({}),
    },
  },

  setup(props) {
    const $q = useQuasar();
    const filter = ref('');
    const loading = ref(false);
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const selectedRows = ref([] as GenericTableData[]);
    const tableRows: Ref<GenericTableData[]> = ref([]);

    const pagination = ref({
      sortBy: props.defaultSort.sortBy || '',
      descending: props.defaultSort.descending || false,
      page: 1,
      rowsPerPage: 10,
      rowsNumber: props.usePagination ? 10 : undefined,
    });
    const clientSidePagination = ref({
      total: 0,
    });

    const filterSubmitting = ref(false);

    const invisibleColumnsObjects = computed(() => {
      // Use spread operation to avoid copying objects by reference
      return [...props.tableColumns]
        .filter(
          (column) =>
            (!column.required && column.visibleAsColumn) ||
            (!column.required && column.visibleAsColumn === undefined)
        )
        .map((column) => column);
    });

    // Use spread operation to avoid copying objects by reference
    const filterableColumns = computed(() =>
      [...props.tableColumns].filter(
        (column) => column.filterable && column.filterInputType
      )
    );

    const existingQueryString = route.query as { [index: string]: string };

    const filterFormArray: string[] = filterableColumns.value.map(
      (col) => col.name as string
    );
    let filterForm: { [index: string]: string | boolean } = reactive({});
    filterFormArray.forEach((name) => {
      if (!isEmpty(existingQueryString)) {
        const value = existingQueryString[name];
        let normalisedValue;
        if (value) {
          if (value === 'true') normalisedValue = true;
          if (value === 'false') normalisedValue = false;
          else normalisedValue = value;
          filterForm[name] = normalisedValue;
        }
      } else filterForm[name] = '';
    });

    const clearFilter = async function () {
      filterFormArray.forEach((name) => {
        filterForm[name] = '';
      });

      // clear query string
      void router.push({ query: {} });

      const { page, rowsPerPage, sortBy, descending } = pagination.value;

      await fetchTableData({
        paginationParams: {
          page,
          descending,
          perPage: rowsPerPage,
          sortBy,
        },
        queryObject: {},
      });
    };

    const visibleColumns = ref([]);

    const processTableRequest = async function (
      requestProps: TableRequestInterface
    ) {
      const { page, rowsPerPage, sortBy, descending } = requestProps.pagination;

      await fetchTableData({
        paginationParams: {
          page,
          descending,
          perPage: rowsPerPage,
          sortBy,
        },
        queryObject: filterForm,
      });
    };

    const fetchTableData: FetchTableDataInterface = async function (
      options
    ): Promise<void> {
      const paginationParams = options?.paginationParams;
      const queryObject = options?.queryObject;

      loading.value = true;

      await store
        .dispatch('quasar_tables/FETCH_TABLE_DATA', {
          paginationParams: props.usePagination
            ? {
                page: paginationParams?.page ?? pagination.value.page,
                descending:
                  paginationParams?.descending ?? pagination.value.descending,
                perPage:
                  paginationParams?.perPage ?? pagination.value.rowsPerPage,
                sortBy: paginationParams?.sortBy ?? pagination.value.sortBy,
              }
            : {},
          entityEndPoint: props.tableDataFetchEndPoint,
          queryObject: props.useMultiFilter
            ? { ...queryObject, ...props.extraQueryStrings }
            : { ...props.extraQueryStrings },
          isCompanySpecific: props.isCompanySpecific,
        })
        .then((response: ResponseData) => {
          void nextTick(() => {
            // The value from the getter is actually a Proxy which does not work with the Quasar table. So stringify and parse the Proxy first.
            const data: GenericTableData[] = JSON.parse(
              JSON.stringify(
                store.getters['quasar_tables/GET_TABLE_ROWS'] as unknown[]
              )
            );

            tableRows.value = [];
            tableRows.value = data;

            const meta = response?.data?.meta;

            if (meta) {
              pagination.value.page = meta.current_page;
              pagination.value.rowsPerPage = meta.per_page;
              pagination.value.rowsNumber = meta.total;
            } else {
              pagination.value.page =
                paginationParams?.page || pagination.value.page;
              pagination.value.rowsPerPage =
                paginationParams?.perPage || pagination.value.rowsPerPage;

              clientSidePagination.value.total = data.length;
            }
            pagination.value.sortBy =
              paginationParams?.sortBy || pagination.value.sortBy;
            pagination.value.descending = paginationParams?.descending;

            loading.value = false;
          });
          return;
        })
        .catch(() => {
          loading.value = false;
          tableRows.value.length = 0;
          return {};
        });
    };

    const submitFilter = async () => {
      const { page, rowsPerPage, sortBy, descending } = pagination.value;

      let activeFilter: { [index: string]: string } = {};
      if (!isEmpty(filterForm)) {
        for (const item in filterForm) {
          const value = filterForm[item];
          if (value !== undefined && value !== null && value !== '') {
            activeFilter[item] = <string>value;
          }
        }
      }

      // clear query string
      void router.push({ query: activeFilter });

      filterSubmitting.value = true;
      await fetchTableData({
        paginationParams: {
          page,
          descending,
          perPage: rowsPerPage,
          sortBy,
        },
        queryObject: activeFilter,
      })
        .then(() => {
          filterSubmitting.value = false;
        })
        .catch(() => {
          filterSubmitting.value = false;
        });
    };

    const data = reactive({
      columns: props.tableColumns,
      stickyTable: false,
    });

    const deleteRow = (id: string | number) => {
      if (props.rowDeleteActionType) {
        $q.dialog({
          title: 'Deletion Warning',
          message: `You are about to delete this ${props.entityName}. Please type 'DELETE' to confirm your action.`,
          prompt: {
            model: '',
            isValid: (val: string) => val.trim().toLowerCase() === 'delete',
            type: 'text',
          },
          cancel: true,
          persistent: true,
        }).onOk(async () => {
          const deleteProgressDialog = $q.dialog({
            title: 'In Progress',
            message: 'Software at work!',
            progress: true,
            ok: false,
            cancel: false,
            persistent: true,
          });
          await store
            .dispatch(props.rowDeleteActionType, id)
            .then(() => {
              // Show success message before dialog is hidden programmatically
              deleteProgressDialog.update({
                title: 'Success',
                message: `${props.entityName} was successfully deleted`,
                progress: false,
              });
              // Avoid screen flicker for quick operations
              setTimeout(() => {
                deleteProgressDialog.hide();
              }, 1500);

              void fetchTableData({ queryObject: filterForm });
            })
            .catch(() => {
              deleteProgressDialog.hide();
            });
        });
      } else {
        $q.notify({
          type: 'negative',
          message: 'Deletion type is not set for this table',
          position: 'top',
        });
      }
    };

    const tableRefresh = async function () {
      await fetchTableData({ queryObject: filterForm });
    };

    onBeforeUnmount(() => {
      void emitter.off('quasar-table::refresh', () => {
        store.commit('quasar_tables/SET_SELECTED_ROWS', null);
        selectedRows.value = [];
      });
    });

    onMounted(async () => {
      await tableRefresh();

      // Listen for table refresh event
      emitter.on('quasar-table::refresh', async () => {
        store.commit('quasar_tables/SET_SELECTED_ROWS', null);
        selectedRows.value = [];
        await tableRefresh();
      });

      store.commit('quasar_tables/SET_SELECTED_ROWS', null);
      store.commit(
        'quasar_tables/SET_SELECTION_ACTIONS',
        readonly(ref(props.selectionActions))
      );
    });

    const currentCompany = computed(
      () => store.getters['auth/GET_CURRENT_COMPANY']
    );

    // Reactively watch for changes in the currentCompany and update the table
    watch(currentCompany, async () => {
      await fetchTableData({ queryObject: filterForm });
    });
    // Watch for changes in the querystring object
    watch(
      () => route.query as { [index: string]: string },
      async (newQueryString: { [index: string]: string }) => {
        if (!isEmpty(newQueryString)) {
          for (const item in newQueryString) {
            const value = newQueryString[item];
            let normalisedValue;
            if (value !== undefined && value !== null && value !== '') {
              if (value === 'true') normalisedValue = true;
              if (value === 'false') normalisedValue = false;
              else normalisedValue = value;
              filterForm[item] = normalisedValue;
            } else filterForm[item] = '';
          }
        }

        await fetchTableData({ queryObject: newQueryString });
      },
      { deep: true }
    );

    // Watch for changes in the selectedRows array
    watch(
      selectedRows,
      (newSelections) => {
        // Update quasar_tables store
        store.commit('quasar_tables/SET_SELECTED_ROWS', newSelections);
      },
      { deep: true }
    );

    return {
      nameOfTable: ref(props.tableName),
      selectedRows,
      visibleColumns,
      invisibleColumnsObjects,
      columns: computed(() =>
        props.tableColumns.filter((col) => {
          if (col.visibleAsColumn !== undefined) {
            return col.visibleAsColumn;
          } else return true;
        })
      ),
      paginationModel: props.usePagination ? pagination : null,
      pagesNumber: computed(() => {
        return Math.ceil(
          tableRows?.value?.length ?? 1 / pagination.value.rowsPerPage
        );
      }),
      tableDataRows: tableRows,
      stickyTable: data.stickyTable,
      loading,
      processTableRequest,
      filter,
      noResultsLabel_: ref(props.noResultsLabel),
      showActions_: ref(props.showActions),
      deleteRow,
      filterPanelExpanded: ref(false),
      filterableColumns,
      filterForm,
      submitFilter,
      clearFilter,
      filterSubmitting,
      resourcePermissions: useResourcePermissions(
        props.resourceActionPermissions
      ),
      fetchTableData,
      clientSidePagination,
    };
  },
});
</script>

<style lang="sass">
.my-sticky-header-column-table
  /* height or max-height is important */
  max-height: 80vh

  /* specifying max-width so the example can
    highlight the sticky column on any browser window */
  max-width: 50vw

  td:first-child, td:nth-child(2)
    /* bg color is important for td; just specify one */
    background-color: white !important

  tr th
    position: sticky
    /* higher than z-index for td below */
    z-index: 2
    /* bg color is important; just specify one */
    background: #fff

  /* this will be the loading indicator */
  thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
    /* highest z-index */
    z-index: 4
  thead tr:first-child th
    top: 0
    z-index: 1
  tr:first-child th:first-child, tr:nth-child(2) th:nth-child(2)
    /* highest z-index */
    z-index: 4

  td:first-child
    z-index: 1

  td:first-child, th:first-child
    position: sticky
    left: 0
  td:nth-child(2), th:nth-child(2)
    position: sticky
    left: 60px
</style>
