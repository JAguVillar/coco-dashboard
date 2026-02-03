import { ref } from "vue";
import { useToast } from "#imports";

export function useDeleteConfirmation({ deleteFn, onSuccess, entityName = "elemento" }) {
  const toast = useToast();
  const open = ref(false);
  const itemToDelete = ref(null);
  const deleting = ref(false);

  function requestDelete(item) {
    itemToDelete.value = item;
    open.value = true;
  }

  function cancel() {
    open.value = false;
    itemToDelete.value = null;
  }

  async function confirm() {
    if (!itemToDelete.value || deleting.value) return;

    deleting.value = true;
    try {
      await deleteFn(itemToDelete.value.id);

      toast.add({
        title: `${entityName} eliminado`,
        description: "Se eliminó correctamente",
        color: "success",
      });

      open.value = false;
      itemToDelete.value = null;

      if (onSuccess) await onSuccess();
    } catch (e) {
      console.error(e);
      toast.add({
        title: "Error",
        description: `No se pudo eliminar el ${entityName.toLowerCase()}`,
        color: "error",
      });
    } finally {
      deleting.value = false;
    }
  }

  return {
    open,
    itemToDelete,
    deleting,
    requestDelete,
    cancel,
    confirm,
  };
}
