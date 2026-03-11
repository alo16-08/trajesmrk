import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const initialClients = [];

const initialSaleInventory = [];

const initialRentalInventory = [];

const initialRentals = [];

function crearFolio() {
  return `R-${Math.floor(100000 + Math.random() * 900000)}`;
}

function inventoryKey(item) {
  return `${item.pieza}-${item.modelo}-${item.color}-${item.talla}`;
}

function formatPiezas(piezas) {
  return [
    `Saco ${piezas.saco.modelo} ${piezas.saco.color} ${piezas.saco.talla}`,
    piezas.pantalon
      ? `Pantalón ${piezas.pantalon.modelo} ${piezas.pantalon.color} ${piezas.pantalon.talla}`
      : "Pantalón no incluye",
    piezas.chaleco
      ? `Chaleco ${piezas.chaleco.modelo} ${piezas.chaleco.color} ${piezas.chaleco.talla}`
      : "Chaleco no incluye",
    `Camisa ${piezas.camisa || "-"}`,
  ].join(" · ");
}

function getSuggestedRentalByModel(modelo) {
  const normalized = String(modelo || "").toLowerCase();
  if (normalized.includes("slim")) return 600;
  if (normalized.includes("lino")) return 800;
  return 700;
}

function formatWhatsappNumber(phone) {
  return String(phone || "")
    .replace(/\D/g, "")
    .replace(/^52/, "")
    .replace(/^1/, "");
}

function buildReceiptMessage(rental) {
  return [
    "*Trajes Mr.K*",
    `Comprobante de renta ${rental.folio}`,
    `Cliente: ${rental.cliente}`,
    `Fecha de renta: ${rental.fechaRenta || "-"}`,
    
    `Fecha de devolución: ${rental.fechaEntrega || "-"} (de 9:00am a 2:00pm)`,
    `Traje rentado: ${[
  rental.piezas.saco ? `${rental.piezas.saco.modelo} ${rental.piezas.saco.color}` : null,
  rental.piezas.pantalon ? "con pantalón" : "sin pantalón",
  rental.piezas.chaleco ? "con chaleco" : "sin chaleco",
].filter(Boolean).join(" ")}`,
    `Renta total: $${rental.totalRenta}`,
    `Pagó: $${rental.anticipo}`,
    `Falta por pagar: $${rental.restanteRenta}`,
    "",
    "Al recoger el traje es necesario dejar una identificación:",
    "• Si deja INE deberá dejar un depósito que se devuelve al entregar el traje.",
    "• Si deja Licencia de conducir no se requiere depósito.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildWhatsAppLink(rental, clientPhone) {
  const text = encodeURIComponent(buildReceiptMessage(rental));
  const phone = formatWhatsappNumber(clientPhone);
  return phone ? `https://wa.me/52${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}

export default function TrajesRentasPreview() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [adminPassword, setAdminPassword] = useState("1234");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [secretCode, setSecretCode] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");

  const [activeTab, setActiveTab] = useState("Nueva renta");
  const [search, setSearch] = useState("");

  const [clients, setClients] = useState(initialClients);

  useEffect(() => {
  async function fetchClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error cargando clientes:", error);
      return;
    }

    setClients(data || []);
  }

  fetchClientes();
}, []);

useEffect(() => {
  async function fetchSaleInventory() {
    const { data, error } = await supabase
      .from("inventario_venta")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error cargando inventario de venta:", error);
      return;
    }

    setSaleInventory(data || []);
  }

  fetchSaleInventory();
}, []);

useEffect(() => {
  async function fetchRentalInventory() {
    const { data, error } = await supabase
      .from("inventario_renta")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error cargando inventario de renta:", error);
      return;
    }

    setRentalInventory(data || []);
  }

  fetchRentalInventory();
}, []);

useEffect(() => {
  async function fetchRentas() {
    const { data, error } = await supabase
      .from("rentas")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error cargando rentas:", error);
      return;
    }

    const rentasFormateadas = (data || []).map((r) => ({
      id: r.id,
      folio: r.folio,
      cliente: r.cliente || "",
      fechaRenta: r.fecha_renta || "",
      fechaEntrega: r.fecha_entrega || "",
      fechaRecogida: r.fecha_recogida || "",
      horaRecogida: r.hora_recogida || "",
      piezas: r.piezas || {},
      notas: r.notas || "",
      totalRenta: Number(r.total_renta || 0),
      anticipo: Number(r.anticipo || 0),
      restanteRenta: Number(r.restante_renta || 0),
      deposito: Number(r.deposito || 0),
      depositoPendiente: Number(r.deposito_pendiente || 0),
      depositoPorDevolver: Number(r.deposito_por_devolver || 0),
      estado: r.estado || "Rentado",
    }));

    setRentals(rentasFormateadas);
  }

  fetchRentas();
}, []);

  const [clientSaved, setClientSaved] = useState(false);
  const [editingClientKey, setEditingClientKey] = useState(null);
  const [clientForm, setClientForm] = useState({ nombre: "", telefono: "", direccion: "", referencia: "" });

  const [saleInventory, setSaleInventory] = useState(initialSaleInventory);
  const [rentalInventory, setRentalInventory] = useState(initialRentalInventory);
  const [inventorySaved, setInventorySaved] = useState(false);
  const [editingSaleKey, setEditingSaleKey] = useState(null);
  const [editingRentalKey, setEditingRentalKey] = useState(null);
  const [saleForm, setSaleForm] = useState({ modelo: "", color: "", talla: "", precio: "", stock: "" });
  const [inventoryForm, setInventoryForm] = useState({ pieza: "Saco", modelo: "", color: "", talla: "", disponibles: "" });

  const [rentals, setRentals] = useState(initialRentals);
  const [saved, setSaved] = useState(false);
  const [rentalMessage, setRentalMessage] = useState("");
  const [lastReceiptLink, setLastReceiptLink] = useState("");
  const [form, setForm] = useState({
    cliente: "",
    fechaRenta: "",
    fechaEntrega: "",
    fechaRecogida: "",
    horaRecogida: "",
    total: "",
    anticipo: "",
    deposito: "",
    sacoKey: "",
    pantalonKey: "",
    chalecoKey: "",
    camisa: "",
    largoPantalon: "",
    notas: "",
  });

  const filteredRentals = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return rentals;
    return rentals.filter((r) => {
      const resumenPagos = `${r.totalRenta} ${r.anticipo} ${r.restanteRenta} ${r.deposito} ${r.depositoPendiente} ${r.depositoPorDevolver}`;
      const text = [r.folio, r.cliente, formatPiezas(r.piezas), resumenPagos, r.estado].join(" ").toLowerCase();
      return text.includes(term);
    });
  }, [rentals, search]);

  const groupedRentalInventory = useMemo(() => {
    return {
      saco: rentalInventory.filter((item) => item.pieza === "Saco"),
      pantalon: rentalInventory.filter((item) => item.pieza === "Pantalón"),
      chaleco: rentalInventory.filter((item) => item.pieza === "Chaleco"),
    };
  }, [rentalInventory]);

  function updateField(key, value) {
  setSaved(false);
  setRentalMessage("");

  if (["sacoKey", "pantalonKey", "chalecoKey"].includes(key)) {
    const selectedPiece = rentalInventory.find((item) => inventoryKey(item) === value);
    if (selectedPiece) {
      const sugerido = getSuggestedRentalByModel(selectedPiece.modelo);
      setForm((prev) => ({
        ...prev,
        [key]: value,
        total: String(sugerido),
        deposito: String(sugerido),
      }));
      return;
    }
  }

  if (key === "camisa") {
    setForm((prev) => {
      const teniaCamisa = String(prev.camisa || "").trim() !== "";
      const tieneCamisaAhora = String(value || "").trim() !== "";

      let rentaActual = Number(prev.total || 0);
      let depositoActual = Number(prev.deposito || 0);

      if (!teniaCamisa && tieneCamisaAhora) {
        rentaActual += 100;
        depositoActual += 100;
      }

      if (teniaCamisa && !tieneCamisaAhora) {
        rentaActual = Math.max(rentaActual - 100, 0);
        depositoActual = Math.max(depositoActual - 100, 0);
      }

      return {
        ...prev,
        camisa: value,
        total: String(rentaActual),
        deposito: String(depositoActual),
      };
    });
    return;
  }

  setForm((prev) => ({ ...prev, [key]: value }));
}

  function updateClientField(key, value) {
    setClientSaved(false);
    setClientForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateSaleForm(key, value) {
    setInventorySaved(false);
    setSaleForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateInventoryForm(key, value) {
    setInventorySaved(false);
    setInventoryForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAddClient() {
  if (!clientForm.nombre.trim() || !clientForm.telefono.trim()) return;

  const nuevoCliente = {
    nombre: clientForm.nombre.trim(),
    telefono: clientForm.telefono.trim(),
    direccion: clientForm.direccion.trim(),
    referencia: clientForm.referencia.trim(),
  };

  if (editingClientKey) {
    const clienteOriginal = clients.find(
      (client) => `${client.nombre}-${client.telefono}` === editingClientKey
    );

    if (!clienteOriginal?.id) {
      alert("No se encontró el cliente para editar.");
      return;
    }

    const { data, error } = await supabase
      .from("clientes")
      .update(nuevoCliente)
      .eq("id", clienteOriginal.id)
      .select();

    if (error) {
  console.error("Error Supabase:", error);
  alert("Error al actualizar cliente: " + error.message);
  return;
}

    if (data && data[0]) {
      setClients((prev) =>
        prev.map((client) => (client.id === data[0].id ? data[0] : client))
      );
    }

    setEditingClientKey(null);
  } else {
    const { data, error } = await supabase
      .from("clientes")
      .insert([nuevoCliente])
      .select();

    if (error) {
  console.error("Error Supabase:", error);
  alert("Error al guardar cliente: " + error.message);
  return;
}
    if (data && data[0]) {
      setClients((prev) => [data[0], ...prev]);
    }
  }

  setClientSaved(true);
  setClientForm({ nombre: "", telefono: "", direccion: "", referencia: "" });
}

  function handleEditClient(client) {
    setClientSaved(false);
    setEditingClientKey(`${client.nombre}-${client.telefono}`);
    setClientForm({ ...client });
  }

  function handleCancelEditClient() {
    setEditingClientKey(null);
    setClientSaved(false);
    setClientForm({ nombre: "", telefono: "", direccion: "", referencia: "" });
  }

  async function handleAddSaleInventory() {
  if (!saleForm.modelo.trim() || !saleForm.color.trim() || !saleForm.talla.trim()) return;

  const nuevoTraje = {
    modelo: saleForm.modelo.trim(),
    color: saleForm.color.trim(),
    talla: saleForm.talla.trim(),
    precio: Number(saleForm.precio || 0),
    stock: Number(saleForm.stock || 0),
  };

  if (editingSaleKey) {
    const trajeOriginal = saleInventory.find(
      (item) => `${item.modelo}-${item.color}-${item.talla}` === editingSaleKey
    );

    if (!trajeOriginal?.id) {
      alert("No se encontró el traje para editar.");
      return;
    }

    const { data, error } = await supabase
      .from("inventario_venta")
      .update(nuevoTraje)
      .eq("id", trajeOriginal.id)
      .select();

    if (error) {
      console.error("Error actualizando traje en venta:", error);
      alert("Error al actualizar traje en venta.");
      return;
    }

    if (data && data[0]) {
      setSaleInventory((prev) =>
        prev.map((item) => (item.id === data[0].id ? data[0] : item))
      );
    }

    setEditingSaleKey(null);
  } else {
    const { data, error } = await supabase
      .from("inventario_venta")
      .insert([nuevoTraje])
      .select();

    if (error) {
      console.error("Error guardando traje en venta:", error);
      alert("Error al guardar traje en venta.");
      return;
    }

    if (data && data[0]) {
      setSaleInventory((prev) => [data[0], ...prev]);
    }
  }

  setInventorySaved(true);
  setSaleForm({ modelo: "", color: "", talla: "", precio: "", stock: "" });
}

  function handleEditSaleInventory(item) {
    setInventorySaved(false);
    setEditingSaleKey(`${item.modelo}-${item.color}-${item.talla}`);
    setSaleForm({ ...item });
  }

  async function handleDeleteSaleInventory(item) {
  const confirmar = window.confirm("¿Estás seguro de eliminar este traje en venta?");
  if (!confirmar) return;

  const { error } = await supabase
    .from("inventario_venta")
    .delete()
    .eq("id", item.id);

  if (error) {
    console.error("Error eliminando traje en venta:", error);
    alert("Error al eliminar traje en venta.");
    return;
  }

  setSaleInventory((prev) => prev.filter((p) => p.id !== item.id));
  setInventorySaved(true);
}

  async function handleAddUnitsToSale(item, amount = 1) {
  const nuevoStock = Number(item.stock || 0) + amount;

  const { data, error } = await supabase
    .from("inventario_venta")
    .update({ stock: nuevoStock })
    .eq("id", item.id)
    .select();

  if (error) {
    console.error("Error actualizando stock en venta:", error);
    alert("Error al actualizar unidades.");
    return;
  }

  if (data && data[0]) {
    setSaleInventory((prev) =>
      prev.map((current) => (current.id === data[0].id ? data[0] : current))
    );
  }

  setInventorySaved(true);
}

  function handleCancelSaleEdit() {
    setEditingSaleKey(null);
    setInventorySaved(false);
    setSaleForm({ modelo: "", color: "", talla: "", precio: "", stock: "" });
  }

  async function handleAddRentalInventory() {
  if (!inventoryForm.modelo.trim() || !inventoryForm.color.trim() || !inventoryForm.talla.trim()) return;

  const nuevaPieza = {
    pieza: inventoryForm.pieza,
    modelo: inventoryForm.modelo.trim(),
    color: inventoryForm.color.trim(),
    talla: inventoryForm.talla.trim(),
    disponibles: Number(inventoryForm.disponibles || 0),
  };

  if (editingRentalKey) {
    const piezaOriginal = rentalInventory.find((item) => inventoryKey(item) === editingRentalKey);

    if (!piezaOriginal?.id) {
      alert("No se encontró la pieza para editar.");
      return;
    }

    const { data, error } = await supabase
      .from("inventario_renta")
      .update(nuevaPieza)
      .eq("id", piezaOriginal.id)
      .select();

    if (error) {
      console.error("Error actualizando pieza:", error);
      alert("Error al actualizar pieza.");
      return;
    }

    if (data && data[0]) {
      setRentalInventory((prev) =>
        prev.map((item) => (item.id === data[0].id ? data[0] : item))
      );
    }

    setEditingRentalKey(null);

  } else {

    const { data, error } = await supabase
      .from("inventario_renta")
      .insert([nuevaPieza])
      .select();

    if (error) {
      console.error("Error guardando pieza:", error);
      alert("Error al guardar pieza.");
      return;
    }

    if (data && data[0]) {
      setRentalInventory((prev) => [data[0], ...prev]);
    }

  }

  setInventorySaved(true);
  setInventoryForm({ pieza: "Saco", modelo: "", color: "", talla: "", disponibles: "" });
}
  function handleEditRentalInventory(item) {
    setInventorySaved(false);
    setEditingRentalKey(inventoryKey(item));
    setInventoryForm({ ...item });
  }

  async function handleAddUnitsToRental(item, amount = 1) {
  const nuevoTotal = Number(item.disponibles || 0) + amount;

  const { data, error } = await supabase
    .from("inventario_renta")
    .update({ disponibles: nuevoTotal })
    .eq("id", item.id)
    .select();

  if (error) {
    console.error("Error sumando unidades en inventario de renta:", error);
    alert("Error al actualizar unidades.");
    return;
  }

  if (data && data[0]) {
    setRentalInventory((prev) =>
      prev.map((current) => (current.id === data[0].id ? data[0] : current))
    );
  }

  setInventorySaved(true);
}

  async function handleDeleteRental(item) {
  const confirmar = window.confirm("¿Estás seguro de eliminar este modelo?");
  if (!confirmar) return;

  const { error } = await supabase
    .from("inventario_renta")
    .delete()
    .eq("id", item.id);

  if (error) {
    console.error("Error eliminando pieza de renta:", error);
    alert("Error al eliminar pieza de renta.");
    return;
  }

  setRentalInventory((prev) => prev.filter((p) => p.id !== item.id));
  setInventorySaved(true);
}

  function handleCancelRentalEdit() {
    setEditingRentalKey(null);
    setInventorySaved(false);
    setInventoryForm({ pieza: "Saco", modelo: "", color: "", talla: "", disponibles: "" });
  }

  async function handleSave() {
    const saco = rentalInventory.find((item) => inventoryKey(item) === form.sacoKey);
    const pantalon = rentalInventory.find((item) => inventoryKey(item) === form.pantalonKey);
    const chaleco = rentalInventory.find((item) => inventoryKey(item) === form.chalecoKey);

    if (!saco) {
  setRentalMessage("Selecciona un saco válido.");
  return;
}

    const piezasSeleccionadas = [saco, pantalon, chaleco].filter(Boolean);
    const sinDisponibilidad = piezasSeleccionadas.find((item) => Number(item.disponibles || 0) <= 0);

    if (sinDisponibilidad) {
      setRentalMessage(`No hay disponibilidad para ${sinDisponibilidad.pieza} ${sinDisponibilidad.modelo} ${sinDisponibilidad.color} talla ${sinDisponibilidad.talla}.`);
      return;
    }

    const piezasADecrementar = [saco, pantalon, chaleco].filter(Boolean);

for (const pieza of piezasADecrementar) {
  const nuevoDisponible = Math.max(Number(pieza.disponibles || 0) - 1, 0);

  const { error } = await supabase
    .from("inventario_renta")
    .update({ disponibles: nuevoDisponible })
    .eq("id", pieza.id);

  if (error) {
    console.error("Error actualizando inventario de renta:", error);
    alert("Error al descontar inventario.");
    return;
  }
}

setRentalInventory((prev) =>
  prev.map((item) => {
    const piezaActualizada = piezasADecrementar.find((pieza) => pieza.id === item.id);
    if (!piezaActualizada) return item;

    return {
      ...item,
      disponibles: String(Math.max(Number(item.disponibles || 0) - 1, 0)),
    };
  })
);

    const restante = Math.max(Number(form.total || 0) - Number(form.anticipo || 0), 0);
    const nuevaRenta = {
      folio: crearFolio(),
      cliente: form.cliente,
      fechaRenta: form.fechaRenta,
      fechaEntrega: form.fechaEntrega,
      fechaRecogida: form.fechaRecogida,
      horaRecogida: form.horaRecogida,
      notas: form.notas,
      piezas: {
        saco: { modelo: saco.modelo, color: saco.color, talla: saco.talla, pieza: saco.pieza },
        pantalon: pantalon
  ? { modelo: pantalon.modelo, color: pantalon.color, talla: pantalon.talla, pieza: pantalon.pieza }
  : null,
chaleco: chaleco
  ? { modelo: chaleco.modelo, color: chaleco.color, talla: chaleco.talla, pieza: chaleco.pieza }
  : null,
        camisa: form.camisa,
        largo: form.largoPantalon,
      },
      totalRenta: Number(form.total || 0),
      anticipo: Number(form.anticipo || 0),
      restanteRenta: restante,
      deposito: Number(form.deposito || 0),
      depositoPendiente: Number(form.deposito || 0),
      depositoPorDevolver: 0,
      estado: "Rentado",
    };

    const rentaParaSupabase = {
  folio: nuevaRenta.folio,
  cliente: nuevaRenta.cliente,
  fecha_renta: nuevaRenta.fechaRenta || null,
  fecha_entrega: nuevaRenta.fechaEntrega || null,
  fecha_recogida: nuevaRenta.fechaRecogida || null,
  hora_recogida: nuevaRenta.horaRecogida || null,
  piezas: nuevaRenta.piezas,
  notas: nuevaRenta.notas || "",
  total_renta: nuevaRenta.totalRenta,
  anticipo: nuevaRenta.anticipo,
  restante_renta: nuevaRenta.restanteRenta,
  deposito: nuevaRenta.deposito,
  deposito_pendiente: nuevaRenta.depositoPendiente,
  deposito_por_devolver: nuevaRenta.depositoPorDevolver,
  estado: nuevaRenta.estado,
};

const { data, error } = await supabase
  .from("rentas")
  .insert([rentaParaSupabase])
  .select();

if (error) {
  console.error("Error guardando renta:", error);
  alert("Error al guardar renta.");
  return;
}

if (data && data[0]) {
  const rentaGuardada = {
    ...nuevaRenta,
    id: data[0].id,
  };

  setRentals((prev) => [rentaGuardada, ...prev]);

  const clienteSeleccionado = clients.find((client) => client.nombre === form.cliente);
  setLastReceiptLink(buildWhatsAppLink(rentaGuardada, clienteSeleccionado?.telefono));
}

setSaved(true);
setRentalMessage("La renta se guardó, bajó la disponibilidad del inventario y ya puedes abrir el comprobante para enviarlo por WhatsApp.");
setActiveTab("Historial");

    setForm({
  cliente: "",
  fechaRenta: "",
  fechaEntrega: "",
  fechaRecogida: "",
  horaRecogida: "",
  total: "",
  anticipo: "",
  deposito: "",
  sacoKey: "",
  pantalonKey: "",
  chalecoKey: "",
  camisa: "",
  largoPantalon: "",
  notas: "",
});
  }

  async function marcarDevuelto(folio) {
    const renta = rentals.find((r) => r.folio === folio);
    if (!renta || renta.estado === "Devuelto") return;

const { error } = await supabase
  .from("rentas")
  .update({
    estado: "Devuelto",
    deposito_pendiente: 0,
    deposito_por_devolver: renta.deposito
  })
  .eq("id", renta.id);

if (error) {
  console.error("Error marcando devuelto:", error);
  alert("Error al actualizar devolución.");
  return;
}

setRentals((prev) =>
  prev.map((r) =>
    r.folio === folio
      ? {
          ...r,
          estado: "Devuelto",
          depositoPendiente: 0,
          depositoPorDevolver: r.deposito,
        }
      : r
  )
);

    const piezasARegresar = [renta.piezas.saco, renta.piezas.pantalon, renta.piezas.chaleco].filter(Boolean);

for (const pieza of piezasARegresar) {
  const piezaOriginal = rentalInventory.find((item) => inventoryKey(item) === inventoryKey(pieza));
  if (!piezaOriginal) continue;

  const nuevoDisponible = Number(piezaOriginal.disponibles || 0) + 1;

  const { error } = await supabase
    .from("inventario_renta")
    .update({ disponibles: nuevoDisponible })
    .eq("id", piezaOriginal.id);

  if (error) {
    console.error("Error devolviendo inventario:", error);
    alert("Error al devolver inventario.");
    return;
  }
}

setRentalInventory((prev) =>
  prev.map((item) => {
    const piezaOriginal = piezasARegresar.find((pieza) => inventoryKey(item) === inventoryKey(pieza));
    if (!piezaOriginal) return item;

    return {
      ...item,
      disponibles: String(Number(item.disponibles || 0) + 1),
    };
  })
);
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 text-white">
        <div className="mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden lg:block">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-blue-100 backdrop-blur">
                Plataforma interna
              </div>
              <h1 className="text-5xl font-bold leading-tight">Trajes Mr.K</h1>
              <p className="mt-5 text-lg leading-8 text-blue-100/90">
                Administra inventario, clientes, rentas y pagos desde un solo lugar con una experiencia más elegante y profesional.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <LoginStat title="Inventario" value="Actualizado" />
                <LoginStat title="Rentas" value="En control" />
                <LoginStat title="Clientes" value="Organizados" />
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[32px] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[28px] bg-white p-8 text-slate-900">
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-900 to-sky-600 text-2xl font-bold text-white shadow-lg">
                    K
                  </div>
                  <h2 className="text-3xl font-bold">Bienvenido</h2>
                  <p className="mt-2 text-sm text-slate-500">Inicia sesión para entrar al sistema de Trajes Mr.K</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="label">Usuario</label>
                    <input className="input" placeholder="Ingresa tu usuario" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} />
                  </div>

                  <div>
                    <label className="label">Contraseña</label>
                    <input type="password" className="input" placeholder="Ingresa tu contraseña" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
                  </div>

                  <button
                    className="btn-primary w-full"
                    onClick={() => {
                      if (loginUser === "admin" && loginPass === adminPassword) {
                        setLoggedIn(true);
                      } else {
                        alert("Usuario o contraseña incorrectos");
                      }
                    }}
                  >
                    Iniciar sesión
                  </button>

                  <div className="space-y-3">
                    <button
                      type="button"
                      className="btn-secondary w-full"
                      onClick={() => setShowPasswordChange((prev) => !prev)}
                    >
                      Cambiar contraseña
                    </button>

                    {showPasswordChange && (
                      <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                          <label className="label">Código de seguridad</label>
                          <input
                            className="input"
                            placeholder="Ingresa el código"
                            value={secretCode}
                            onChange={(e) => setSecretCode(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="label">Nueva contraseña</label>
                          <input
                            type="password"
                            className="input"
                            placeholder="Nueva contraseña"
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="label">Confirmar contraseña</label>
                          <input
                            type="password"
                            className="input"
                            placeholder="Confirma la contraseña"
                            value={confirmAdminPassword}
                            onChange={(e) => setConfirmAdminPassword(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            className="btn-primary flex-1"
                            onClick={() => {
                              if (secretCode !== "Maytheabundante") {
                                alert("Código incorrecto");
                                return;
                              }
                              if (!newAdminPassword.trim()) {
                                alert("Escribe una nueva contraseña");
                                return;
                              }
                              if (newAdminPassword !== confirmAdminPassword) {
                                alert("Las contraseñas no coinciden");
                                return;
                              }
                              setAdminPassword(newAdminPassword);
                              setSecretCode("");
                              setNewAdminPassword("");
                              setConfirmAdminPassword("");
                              setShowPasswordChange(false);
                              alert("Contraseña cambiada correctamente");
                            }}
                          >
                            Guardar nueva contraseña
                          </button>

                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                              setShowPasswordChange(false);
                              setSecretCode("");
                              setNewAdminPassword("");
                              setConfirmAdminPassword("");
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-6 font-sans">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-sky-700 p-6 text-white shadow-lg flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trajes Mr.K</h1>
            <p className="mt-1 text-blue-100">Gestión de trajes, clientes y rentas para tu negocio.</p>
          </div>
          <button
            className="btn-secondary bg-white/90 text-blue-900 border-white hover:bg-white"
            onClick={() => {
              setLoggedIn(false);
              setLoginUser("");
              setLoginPass("");
            }}
          >
            Cerrar sesión
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Stat label="Trajes registrados" value={String(saleInventory.length + rentalInventory.length)} />
          <Stat label="Rentas activas" value={String(rentals.filter((r) => r.estado === "Rentado").length)} />
          <Stat label="Clientes" value={String(clients.length)} />
          <Stat label="Piezas para renta" value={String(rentalInventory.reduce((acc, item) => acc + Number(item.disponibles || 0), 0))} />
        </div>

        <div className="flex flex-wrap gap-3">
          {["Pagos", "Inventario", "Clientes", "Nueva renta", "Historial"].map((tab) => (
            <button key={tab} type="button" className={`tab-btn ${activeTab === tab ? "active-tab" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Pagos" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Stat label="Cobrado renta" value={`$${rentals.reduce((acc, r) => acc + Number(r.anticipo || 0), 0)}`} />
<Stat label="Falta por cobrar" value={`$${rentals.reduce((acc, r) => acc + Number(r.restanteRenta || 0), 0)}`} />
<Stat label="Depósito por recibir" value={`$${rentals.reduce((acc, r) => acc + Number(r.depositoPendiente || 0), 0)}`} />
<Stat label="Depósito por devolver" value={`$${rentals.reduce((acc, r) => acc + Number(r.depositoPorDevolver || 0), 0)}`} />
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold">Control de pagos</h2>
                
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="p-2 text-left">Folio</th>
                      <th className="p-2 text-left">Cliente</th>
                      <th className="p-2 text-left">Renta</th>
                      <th className="p-2 text-left">Pagó</th>
                      <th className="p-2 text-left">Falta renta</th>
                      <th className="p-2 text-left">Depósito por recibir</th>
                      <th className="p-2 text-left">Depósito</th>
                      <th className="p-2 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentals.map((rental) => (
                      <tr key={rental.folio} className="border-t">
                        <td className="p-2 font-medium">{rental.folio}</td>
                        <td className="p-2">{rental.cliente}</td>
                        <td className="p-2">${Number(rental.totalRenta || 0)}</td>
<td className="p-2">${Number(rental.anticipo || 0)}</td>
<td className="p-2">${Number(rental.restanteRenta || 0)}</td>
<td className="p-2">${Number(rental.depositoPendiente || 0)}</td>
                        <td className="p-2">
                          <div className="flex flex-col gap-2">
                            
                            <button
  className="btn-secondary"
  onClick={async () => {
    const { error } = await supabase
      .from("rentas")
      .update({
        deposito_pendiente: 0,
        deposito_por_devolver: Number(rental.deposito || 0),
      })
      .eq("folio", rental.folio);

    if (error) {
      console.error("Error al registrar depósito recibido:", error);
      alert("Error al registrar depósito recibido.");
      return;
    }

    setRentals((prev) =>
      prev.map((r) =>
        r.folio === rental.folio
          ? {
              ...r,
              depositoPendiente: 0,
              depositoPorDevolver: Number(rental.deposito || 0),
            }
          : r
      )
    );
  }}
>
  Depósito recibido
</button>

<button
  className="btn-secondary"
  onClick={async () => {
    const { error } = await supabase
      .from("rentas")
      .update({
        deposito_por_devolver: 0,
      })
      .eq("folio", rental.folio);

    if (error) {
      console.error("Error al registrar depósito devuelto:", error);
      alert("Error al registrar depósito devuelto.");
      return;
    }

    setRentals((prev) =>
      prev.map((r) =>
        r.folio === rental.folio
          ? { ...r, depositoPorDevolver: 0 }
          : r
      )
    );
  }}
>
  Depósito devuelto
</button>

                          </div>
                        </td>
                        <td className="p-2">{rental.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Inventario" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">{editingSaleKey ? "Editar traje en venta" : "Agregar traje en venta"}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Modelo"><input className="input" value={saleForm.modelo} onChange={(e) => updateSaleForm("modelo", e.target.value)} /></Field>
                  <Field label="Color"><input className="input" value={saleForm.color} onChange={(e) => updateSaleForm("color", e.target.value)} /></Field>
                  <Field label="Talla"><input className="input" value={saleForm.talla} onChange={(e) => updateSaleForm("talla", e.target.value)} /></Field>
                  <Field label="Precio venta"><input className="input" value={saleForm.precio} onChange={(e) => updateSaleForm("precio", e.target.value)} /></Field>
                  <Field label="Stock"><input className="input" value={saleForm.stock} onChange={(e) => updateSaleForm("stock", e.target.value)} /></Field>
                  <div className="md:col-span-2 flex items-center gap-3">
                    <button type="button" className="btn-primary" onClick={handleAddSaleInventory}>{editingSaleKey ? "Guardar cambios" : "Agregar traje en venta"}</button>
                    {editingSaleKey && <button type="button" className="btn-secondary" onClick={handleCancelSaleEdit}>Cancelar</button>}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">{editingRentalKey ? "Editar pieza para renta" : "Agregar pieza para renta"}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Pieza">
                    <select className="input" value={inventoryForm.pieza} onChange={(e) => updateInventoryForm("pieza", e.target.value)}>
                      <option>Saco</option>
                      <option>Pantalón</option>
                      <option>Chaleco</option>
                    </select>
                  </Field>
                  <Field label="Modelo"><input className="input" value={inventoryForm.modelo} onChange={(e) => updateInventoryForm("modelo", e.target.value)} /></Field>
                  <Field label="Color"><input className="input" value={inventoryForm.color} onChange={(e) => updateInventoryForm("color", e.target.value)} /></Field>
                  <Field label="Talla"><input className="input" value={inventoryForm.talla} onChange={(e) => updateInventoryForm("talla", e.target.value)} /></Field>
                  <Field label="Disponibles"><input className="input" value={inventoryForm.disponibles} onChange={(e) => updateInventoryForm("disponibles", e.target.value)} /></Field>
                  <div className="md:col-span-2 flex items-center gap-3">
                    <button type="button" className="btn-primary" onClick={handleAddRentalInventory}>{editingRentalKey ? "Guardar cambios" : "Agregar pieza de renta"}</button>
                    {editingRentalKey && <button type="button" className="btn-secondary" onClick={handleCancelRentalEdit}>Cancelar</button>}
                  </div>
                </div>
              </div>
            </div>

            {inventorySaved && <Notice text="Inventario actualizado en la vista previa." />}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">Trajes en venta (completos)</h2>
                <table className="w-full text-sm">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="p-2 text-left">Modelo</th>
                      <th className="p-2 text-left">Color</th>
                      <th className="p-2 text-left">Talla</th>
                      <th className="p-2 text-left">Precio</th>
                      <th className="p-2 text-left">Stock</th>
                      <th className="p-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleInventory.map((item) => (
                      <tr key={`${item.modelo}-${item.color}-${item.talla}`} className="border-t">
                        <td className="p-2 font-medium">{item.modelo}</td>
                        <td className="p-2">{item.color}</td>
                        <td className="p-2">{item.talla}</td>
                        <td className="p-2">${item.precio || "-"}</td>
                        <td className="p-2">{item.stock || "-"}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" className="btn-secondary" onClick={() => handleEditSaleInventory(item)}>Editar</button>
                            <button type="button" className="btn-secondary" onClick={() => handleAddUnitsToSale(item)}>+1 unidad</button>
                            <button type="button" className="px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleDeleteSaleInventory(item)}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">Trajes para renta (piezas separadas)</h2>
                <table className="w-full text-sm">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="p-2 text-left">Pieza</th>
                      <th className="p-2 text-left">Modelo</th>
                      <th className="p-2 text-left">Color</th>
                      <th className="p-2 text-left">Talla</th>
                      <th className="p-2 text-left">Disponibles</th>
                      <th className="p-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentalInventory.map((item) => (
                      <tr key={inventoryKey(item)} className="border-t">
                        <td className="p-2">{item.pieza}</td>
                        <td className="p-2">{item.modelo}</td>
                        <td className="p-2">{item.color}</td>
                        <td className="p-2">{item.talla}</td>
                        <td className="p-2">{item.disponibles || "-"}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" className="btn-secondary" onClick={() => handleEditRentalInventory(item)}>Editar</button>
                            <button type="button" className="btn-secondary" onClick={() => handleAddUnitsToRental(item)}>+1 unidad</button>
                            <button type="button" className="px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleDeleteRental(item)}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Clientes" && (
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">{editingClientKey ? "Editar cliente" : "Agregar cliente"}</h2>
              <div className="space-y-4">
                <Field label="Nombre completo"><input className="input" value={clientForm.nombre} onChange={(e) => updateClientField("nombre", e.target.value)} /></Field>
                <Field label="Teléfono"><input className="input" value={clientForm.telefono} onChange={(e) => updateClientField("telefono", e.target.value)} /></Field>
                <Field label="Dirección"><input className="input" value={clientForm.direccion} onChange={(e) => updateClientField("direccion", e.target.value)} /></Field>
                <Field label="Referencia o identificación"><input className="input" value={clientForm.referencia} onChange={(e) => updateClientField("referencia", e.target.value)} /></Field>
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" className="btn-primary" onClick={handleAddClient}>{editingClientKey ? "Guardar cambios" : "Guardar cliente"}</button>
                  {editingClientKey && <button type="button" className="btn-secondary" onClick={handleCancelEditClient}>Cancelar</button>}
                </div>
                {clientSaved && <Notice text="Cliente guardado en la vista previa." />}
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Base de clientes</h2>
                <div className="text-sm text-slate-500">{clients.length} cliente(s) registrados</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="p-2 text-left">Nombre</th>
                      <th className="p-2 text-left">Teléfono</th>
                      <th className="p-2 text-left">Dirección</th>
                      <th className="p-2 text-left">Referencia</th>
                      <th className="p-2 text-left">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={`${client.nombre}-${client.telefono}`} className="border-t">
                        <td className="p-2 font-medium">{client.nombre}</td>
                        <td className="p-2">{client.telefono}</td>
                        <td className="p-2">{client.direccion || "-"}</td>
                        <td className="p-2">{client.referencia || "-"}</td>
                        <td className="p-2"><button type="button" className="btn-secondary" onClick={() => handleEditClient(client)}>Editar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Nueva renta" && (
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Registrar nueva renta</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Cliente">
                <select className="input" value={form.cliente} onChange={(e) => updateField("cliente", e.target.value)}>
                  {clients.map((cliente) => <option key={`${cliente.nombre}-${cliente.telefono}`}>{cliente.nombre}</option>)}
                </select>
              </Field>
              <Field label="Fecha de renta"><input type="date" className="input" value={form.fechaRenta} onChange={(e) => updateField("fechaRenta", e.target.value)} /></Field>
              <Field label="Fecha de entrega"><input type="date" className="input" value={form.fechaEntrega} onChange={(e) => updateField("fechaEntrega", e.target.value)} /></Field>
              <Field label="Fecha de recogida"><input type="date" className="input" value={form.fechaRecogida} onChange={(e) => updateField("fechaRecogida", e.target.value)} /></Field>
              <Field label="Hora de recogida"><input type="time" className="input" value={form.horaRecogida} onChange={(e) => updateField("horaRecogida", e.target.value)} /></Field>
              <Field label="Total renta"><input className="input" value={form.total} onChange={(e) => updateField("total", e.target.value)} /></Field>
              <Field label="Cliente deja pagado"><input className="input" value={form.anticipo} onChange={(e) => updateField("anticipo", e.target.value)} /></Field>
              <Field label="Depósito a dejar"><input className="input" value={form.deposito} onChange={(e) => updateField("deposito", e.target.value)} /></Field>

              <Field label="Saco a rentar">
                <select className="input" value={form.sacoKey} onChange={(e) => updateField("sacoKey", e.target.value)}>
                  <option value="">Selecciona una pieza</option>
                  {groupedRentalInventory.saco.map((item) => (
                    <option key={inventoryKey(item)} value={inventoryKey(item)}>
                      {item.modelo} · {item.color} · talla {item.talla} · disponibles {item.disponibles}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Pantalón a rentar">
                <select className="input" value={form.pantalonKey} onChange={(e) => updateField("pantalonKey", e.target.value)}>
                  <option value="">Sin pantalón</option>
                  {groupedRentalInventory.pantalon.map((item) => (
                    <option key={inventoryKey(item)} value={inventoryKey(item)}>
                      {item.modelo} · {item.color} · talla {item.talla} · disponibles {item.disponibles}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Chaleco a rentar">
                <select className="input" value={form.chalecoKey} onChange={(e) => updateField("chalecoKey", e.target.value)}>
                  <option value="">Sin chaleco</option>
                  {groupedRentalInventory.chaleco.map((item) => (
                    <option key={inventoryKey(item)} value={inventoryKey(item)}>
                      {item.modelo} · {item.color} · talla {item.talla} · disponibles {item.disponibles}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Talla camisa"><input className="input" value={form.camisa} onChange={(e) => updateField("camisa", e.target.value)} /></Field>
              <Field label="Largo del pantalón"><input className="input" placeholder="Ej. 102 cm" value={form.largoPantalon} onChange={(e) => updateField("largoPantalon", e.target.value)} /></Field>
              <div className="md:col-span-2">
                <label className="label">Notas</label>
                <textarea className="input" value={form.notas} onChange={(e) => updateField("notas", e.target.value)} />
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <button type="button" className="btn-primary" onClick={handleSave}>Guardar renta</button>
                {saved && <span className="text-sm font-medium text-emerald-700">Renta guardada.</span>}
              </div>
              {rentalMessage && <div className="md:col-span-2"><Notice text={rentalMessage} /></div>}
              {lastReceiptLink && (
                <div className="md:col-span-2">
                  <a href={lastReceiptLink} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-2">
                    Abrir comprobante para WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Historial" && (
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold">Historial de rentas</h2>
              <div className="text-sm text-slate-500">Aquí se muestran las rentas registradas.</div>
            </div>
            <input className="input mb-4" placeholder="Buscar por cliente o piezas" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                  <thead className="text-slate-500">
                  <tr>
                    <th className="p-2 text-left">Folio</th>
                    <th className="p-2 text-left">Cliente</th>
                    <th className="p-2 text-left">Piezas rentadas</th>
                    <th className="p-2 text-left">Recoge</th>
                    <th className="p-2 text-left">Pago renta</th>
                    <th className="p-2 text-left">Depósito</th>
                    <th className="p-2 text-left">Estado</th>
                    <th className="p-2 text-left">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRentals.map((row) => {
                    const clientPhone = clients.find((client) => client.nombre === row.cliente)?.telefono;
                    return (
                      <Row
                        key={row.folio}
                        {...row}
                        notas={row.notas}
                        receiptLink={buildWhatsAppLink(row, clientPhone)}
                        onReturn={marcarDevuelto}
                        onStatusChange={async (folio, estado) => {

  const renta = rentals.find(r => r.folio === folio);

  const { error } = await supabase
    .from("rentas")
    .update({ estado })
    .eq("id", renta.id);

  if (error) {
    console.error("Error actualizando estado:", error);
    alert("Error al actualizar estado.");
    return;
  }

  setRentals((prev) =>
    prev.map((r) => (r.folio === folio ? { ...r, estado } : r))
  );
}}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; }
        textarea.input { min-height: 84px; resize: vertical; }
        .label { display: block; margin-bottom: 4px; font-size: 14px; font-weight: 600; }
        .btn-primary { border-radius: 12px; background: linear-gradient(90deg,#1e3a8a,#2563eb); padding: 12px 18px; font-weight: 600; color: white; }
        .btn-secondary { border-radius: 10px; border: 1px solid #93c5fd; background: #eff6ff; padding: 8px 12px; font-size: 13px; font-weight: 600; color:#1e40af; }
        .tab-btn { border: 1px solid #bfdbfe; background: #f8fafc; padding: 10px 16px; border-radius: 12px; font-size: 14px; font-weight: 500; }
        .active-tab { background: linear-gradient(90deg,#1e3a8a,#2563eb); color: white; border-color: #2563eb; }
      `}</style>
    </div>
  );
}

function LoginStat({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="text-sm text-blue-100/80">{title}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function Notice({ text }) {
  return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{text}</div>;
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Row({ folio, cliente, piezas, fechaRecogida, horaRecogida, totalRenta, anticipo, restanteRenta, deposito, depositoPendiente, depositoPorDevolver, estado, receiptLink, onReturn, onStatusChange, notas }) {
  return (
    <tr className="border-t align-top">
      <td className="p-2 font-medium">{folio}</td>
      <td className="p-2">{cliente}</td>
      <td className="p-2 min-w-[260px]">
        <div className="space-y-2">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <span className="font-semibold text-slate-700">Saco:</span>{" "}
            <span className="text-slate-900">{piezas.saco.modelo} {piezas.saco.color} {piezas.saco.talla}</span>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
  <span className="font-semibold text-slate-700">Pantalón:</span>{" "}
  {piezas.pantalon ? (
    <span className="text-slate-900">
      {piezas.pantalon.modelo} {piezas.pantalon.color} {piezas.pantalon.talla}
    </span>
  ) : (
    <span className="text-slate-500">No incluye</span>
  )}
  {piezas.pantalon && piezas.largo && (
    <div className="mt-1 text-xs text-slate-500">Largo pantalón: {piezas.largo}</div>
  )}
</div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
  <span className="font-semibold text-slate-700">Chaleco:</span>{" "}
  {piezas.chaleco ? (
    <span className="text-slate-900">
      {piezas.chaleco.modelo} {piezas.chaleco.color} {piezas.chaleco.talla}
    </span>
  ) : (
    <span className="text-slate-500">No incluye</span>
  )}
</div>
          <div className="rounded-xl bg-blue-50 px-3 py-2 text-sm">
            <span className="font-semibold text-blue-900">Camisa:</span>{" "}
            <span className="text-blue-900">{piezas.camisa}</span>
          </div>
          {notas && (
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <span className="font-semibold">Notas:</span> {notas}
            </div>
          )}
        </div>
      </td>
      <td className="p-2">
        <div>{fechaRecogida || "-"}</div>
        <div className="text-xs text-slate-500">{horaRecogida ? `${horaRecogida} hrs` : "-"}</div>
      </td>
      <td className="p-2">
        
        <div className="text-sm">
  Total: ${Number(totalRenta || 0)}
</div>
<div className="text-sm text-slate-500">
  Pagó: ${Number(anticipo || 0)} · Falta: ${Number(restanteRenta || 0)}
</div>
      </td>
      <td className="p-2">
        
  <div className="text-sm">
  Total: ${Number(deposito || 0)}
</div>
<div className="text-sm text-slate-500">
  Pendiente: ${Number(depositoPendiente || 0)} · Devolver: ${Number(depositoPorDevolver || 0)}
</div>
      </td>
      <td className="p-2">
        {estado === "Devuelto" ? (
          <span className="font-semibold text-red-600">Devuelto</span>
        ) : (
          <select className="input min-w-[140px]" value={estado} onChange={(e) => onStatusChange(folio, e.target.value)}>
            <option>Rentado</option>
            <option>Preparando</option>
            <option>Entregado</option>
          </select>
        )}
      </td>
      <td className="p-2">
        <div className="flex flex-col gap-2">
          <a href={receiptLink} target="_blank" rel="noreferrer" className="btn-secondary whitespace-nowrap text-center">
            Comprobante WhatsApp
          </a>
          {estado === "Entregado" ? (
            <button type="button" className="btn-secondary whitespace-nowrap" onClick={() => onReturn(folio)}>Marcar devuelto</button>
          ) : (
            <span className="text-xs text-slate-400">Sin acciones</span>
          )}
        </div>
      </td>
    </tr>
  );
}
