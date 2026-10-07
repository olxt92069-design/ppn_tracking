const STORAGE_KEY = "trackingPPNData";

const DEFAULT_DATA = [{
  id: crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()),

  username: "Hammedjos",
  trxId: "TRX8829102",
  jenisPPN: "PPN",
  persentase: 11,

  nilaiTransaksi: 100000,
  nilaiPPN: 11000,
  totalTransaksi: 111000,
  sisaPPN: 450000,

  progress: 99.1
}];


/* =========================================================
   STATE
========================================================= */

let data = loadData();
let selectedId = data[0]?.id || null;
let editingId = null;


/* =========================================================
   DOM HELPER
========================================================= */

const $ = selector => document.querySelector(selector);

const body = $("#trackingBody");
const selected = $("#selectedId");
const count = $("#dataCount");

const dialog = $("#dataDialog");
const form = $("#dataForm");
const autoCalc = $("#autoCalc");


/* =========================================================
   LOAD DATA
========================================================= */

function loadData(){

  try{

    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    );

    if(
      Array.isArray(saved) &&
      saved.length
    ){

      return saved;

    }

    return structuredClone(DEFAULT_DATA);

  }catch{

    return structuredClone(DEFAULT_DATA);

  }

}


/* =========================================================
   SAVE DATA
========================================================= */

function saveData(){

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );

}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function rupiah(value){

  return new Intl.NumberFormat("id-ID").format(
    Number(value) || 0
  );

}


/* =========================================================
   FORMAT MONEY
========================================================= */

function money(value, plus = false){

  return `
    <span class="currency">
      ${plus ? "+" : ""}Rp${rupiah(value)}
    </span>
  `;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function esc(value){

  return String(value ?? "").replace(
    /[&<>"']/g,
    match => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[match])
  );

}


/* =========================================================
   NORMALIZE PROGRESS
========================================================= */

function normalizeProgress(value){

  let progress = Number(value);

  if(!Number.isFinite(progress)){
    progress = 0;
  }

  /*
    Batasi progress:
    minimum 0
    maximum 100
  */

  progress = Math.max(
    0,
    Math.min(100, progress)
  );

  return progress;

}


/* =========================================================
   PROGRESS CLASS
========================================================= */

function getProgressClass(progress){

  const value = normalizeProgress(progress);

  /*
    0 - 49.9
    merah
  */

  if(value < 50){
    return "progress-low";
  }

  /*
    50 - 99.9
    kuning
  */

  if(value < 100){
    return "progress-medium";
  }

  /*
    100
    hijau
  */

  return "progress-high";

}


/* =========================================================
   RENDER TABLE
========================================================= */

function render(){

  const searchInput = $("#searchInput");

  const q = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";


  /* -------------------------------------------------------
     FILTER DATA
  ------------------------------------------------------- */

  const filtered = data.filter(d => {

    const username = String(
      d.username ?? ""
    ).toLowerCase();

    const trxId = String(
      d.trxId ?? ""
    ).toLowerCase();

    return (
      username.includes(q) ||
      trxId.includes(q)
    );

  });


  /* -------------------------------------------------------
     RENDER TABLE
  ------------------------------------------------------- */

  body.innerHTML = filtered.map(d => {

    const progress = normalizeProgress(
      d.progress
    );

    const progressClass =
      getProgressClass(progress);


    return `
      <tr>

        <!-- USERNAME -->
        <td class="username">
          ${esc(d.username)}
        </td>


        <!-- TRANSACTION ID -->
        <td class="trx">
          ${esc(d.trxId)}
        </td>


        <!-- JENIS PPN -->
        <td class="dark">
          ${esc(d.jenisPPN)}
          <br>
          ${esc(d.persentase)}%
        </td>


        <!-- NILAI TRANSAKSI -->
        <td class="dark money">
          ${money(d.nilaiTransaksi)}
        </td>


        <!-- PPN -->
        <td class="ppn money">
          ${money(d.nilaiPPN, true)}
        </td>


        <!-- TOTAL TRANSAKSI -->
        <td class="dark money">
          ${money(d.totalTransaksi)}
        </td>


        <!-- SISA PPN -->
        <td class="sisa money">
          ${money(d.sisaPPN)}
        </td>


        <!-- PROGRESS -->
        <td>

          <span class="progress-badge ${progressClass}">
            ${progress.toFixed(1)}%
          </span>

        </td>

      </tr>
    `;

  }).join("");


  /* -------------------------------------------------------
     EMPTY STATE
  ------------------------------------------------------- */

  const emptyState = $("#emptyState");

  if(emptyState){

    emptyState.hidden =
      filtered.length > 0;

  }


  /* -------------------------------------------------------
     DATA COUNT
  ------------------------------------------------------- */

  if(count){

    count.textContent =
      `${data.length} data`;

  }


  /* -------------------------------------------------------
     SELECT DATA
  ------------------------------------------------------- */

  if(selected){

    selected.innerHTML = data.map(d => {

      return `
        <option value="${esc(d.id)}">
          ${esc(d.username)} — ${esc(d.trxId)}
        </option>
      `;

    }).join("");


    if(data.length){

      const exists = data.some(
        d => d.id === selectedId
      );

      selected.value =
        exists
          ? selectedId
          : data[0].id;

      selectedId =
        selected.value;

    }

  }

}


/* =========================================================
   OPEN FORM
========================================================= */

function openForm(mode){

  /* -------------------------------------------------------
     EDIT CHECK
  ------------------------------------------------------- */

  if(
    mode === "edit" &&
    !selectedId
  ){

    toast(
      "Pilih data terlebih dahulu"
    );

    return;

  }


  /* -------------------------------------------------------
     SET EDITING ID
  ------------------------------------------------------- */

  editingId =
    mode === "edit"
      ? selectedId
      : null;


  /* -------------------------------------------------------
     MODAL TITLE
  ------------------------------------------------------- */

  $("#modalTitle").textContent =
    mode === "edit"
      ? "Edit Data"
      : "Tambah Data";


  $("#saveBtn").textContent =
    mode === "edit"
      ? "Simpan Perubahan"
      : "Tambah Data";


  /* -------------------------------------------------------
     DEFAULT DATA
  ------------------------------------------------------- */

  const defaultFormData = {

    username: "",
    trxId: "",

    jenisPPN: "PPN",
    persentase: 11,

    nilaiTransaksi: 0,
    nilaiPPN: 0,
    totalTransaksi: 0,
    sisaPPN: 0,

    progress: 0

  };


  /* -------------------------------------------------------
     GET DATA
  ------------------------------------------------------- */

  const d =
    mode === "edit"
      ? data.find(
          item => item.id === selectedId
        )
      : defaultFormData;


  /* -------------------------------------------------------
     FILL FORM
  ------------------------------------------------------- */

  if(d){

    Object.entries(d).forEach(
      ([key, value]) => {

        if(form.elements[key]){

          form.elements[key].value =
            value;

        }

      }
    );

  }


  /* -------------------------------------------------------
     AUTO CALCULATE
  ------------------------------------------------------- */

  if(autoCalc){

    autoCalc.checked = true;

  }


  /* -------------------------------------------------------
     OPEN MODAL
  ------------------------------------------------------- */

  dialog.showModal();

}


/* =========================================================
   AUTO CALCULATE PPN
========================================================= */

function updateAuto(){

  if(
    !autoCalc ||
    !autoCalc.checked
  ){

    return;

  }


  const nilai =
    Number(
      form.elements.nilaiTransaksi.value
    ) || 0;


  const rate =
    Number(
      form.elements.persentase.value
    ) || 0;


  const ppn =
    Math.round(
      nilai * rate / 100
    );


  const total =
    nilai + ppn;


  form.elements.nilaiPPN.value =
    ppn;


  form.elements.totalTransaksi.value =
    total;

}


/* =========================================================
   AUTO CALCULATE EVENTS
========================================================= */

[
  "nilaiTransaksi",
  "persentase"
].forEach(key => {

  if(form.elements[key]){

    form.elements[key].addEventListener(
      "input",
      updateAuto
    );

  }

});


/* =========================================================
   FORM SUBMIT
========================================================= */

form.addEventListener(
  "submit",
  event => {

    event.preventDefault();


    /* -----------------------------------------------------
       GET FORM DATA
    ----------------------------------------------------- */

    const fd =
      new FormData(form);


    const obj =
      Object.fromEntries(
        fd.entries()
      );


    /* -----------------------------------------------------
       NUMBER FIELDS
    ----------------------------------------------------- */

    [
      "persentase",
      "nilaiTransaksi",
      "nilaiPPN",
      "totalTransaksi",
      "sisaPPN",
      "progress"

    ].forEach(key => {

      obj[key] =
        Number(obj[key]) || 0;

    });


    /* -----------------------------------------------------
       NORMALIZE PROGRESS
    ----------------------------------------------------- */

    obj.progress =
      normalizeProgress(
        obj.progress
      );


    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if(
      !obj.username ||
      !obj.username.trim()
    ){

      toast(
        "Username wajib diisi"
      );

      return;

    }


    if(
      !obj.trxId ||
      !obj.trxId.trim()
    ){

      toast(
        "Trx ID wajib diisi"
      );

      return;

    }


    /* -----------------------------------------------------
       EDIT EXISTING DATA
    ----------------------------------------------------- */

    if(editingId){

      const index =
        data.findIndex(
          d => d.id === editingId
        );


      if(index >= 0){

        data[index] = {
          ...data[index],
          ...obj
        };

      }


      selectedId =
        editingId;


      toast(
        "Data berhasil diperbarui"
      );

    }


    /* -----------------------------------------------------
       ADD NEW DATA
    ----------------------------------------------------- */

    else{

      obj.id =
        crypto.randomUUID
          ? crypto.randomUUID()
          : String(
              Date.now()
            );


      data.push(obj);


      selectedId =
        obj.id;


      toast(
        "Data berhasil ditambahkan"
      );

    }


    /* -----------------------------------------------------
       SAVE
    ----------------------------------------------------- */

    saveData();

    render();

    dialog.close();

  }
);


/* =========================================================
   ADD BUTTON
========================================================= */

$("#addBtn").onclick = () => {

  openForm("add");

};


/* =========================================================
   EDIT BUTTON
========================================================= */

$("#editBtn").onclick = () => {

  openForm("edit");

};


/* =========================================================
   CANCEL BUTTON
========================================================= */

$("#cancelBtn").onclick = () => {

  dialog.close();

};


/* =========================================================
   CLOSE BUTTON
========================================================= */

$("#closeBtn").onclick = () => {

  dialog.close();

};


/* =========================================================
   SELECT DATA
========================================================= */

if(selected){

  selected.onchange = () => {

    selectedId =
      selected.value;

  };

}


/* =========================================================
   SEARCH
========================================================= */

const searchInput =
  $("#searchInput");

if(searchInput){

  searchInput.oninput =
    render;

}


/* =========================================================
   DELETE DATA
========================================================= */

$("#deleteBtn").onclick = () => {

  if(!selectedId){

    toast(
      "Tidak ada data untuk dihapus"
    );

    return;

  }


  const d =
    data.find(
      x => x.id === selectedId
    );


  const username =
    d?.username || "";


  if(
    confirm(
      `Apakah Anda yakin ingin menghapus data "${username}"?`
    )
  ){

    data =
      data.filter(
        x => x.id !== selectedId
      );


    selectedId =
      data[0]?.id || null;


    saveData();

    render();

    toast(
      "Data berhasil dihapus"
    );

  }

};


/* =========================================================
   RESET DATA
========================================================= */

$("#resetBtn").onclick = () => {

  if(
    confirm(
      "Reset semua data ke data default?"
    )
  ){

    data =
      structuredClone(
        DEFAULT_DATA
      );


    selectedId =
      data[0]?.id || null;


    saveData();

    render();

    toast(
      "Data berhasil direset"
    );

  }

};


/* =========================================================
   EXPORT JSON
========================================================= */

$("#exportBtn").onclick = () => {

  const blob =
    new Blob(
      [
        JSON.stringify(
          data,
          null,
          2
        )
      ],
      {
        type:"application/json"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const a =
    document.createElement(
      "a"
    );


  a.href = url;

  a.download =
    "tracking-ppn-data.json";


  document.body.appendChild(a);

  a.click();

  a.remove();


  URL.revokeObjectURL(url);

};


/* =========================================================
   IMPORT JSON
========================================================= */

$("#importInput").onchange =
  event => {

    const file =
      event.target.files[0];


    if(!file){

      return;

    }


    const reader =
      new FileReader();


    reader.onload = () => {

      try{

        const imported =
          JSON.parse(
            reader.result
          );


        if(
          !Array.isArray(
            imported
          )
        ){

          throw new Error(
            "Invalid data"
          );

        }


        data =
          imported.map(
            d => ({

              ...d,

              id:
                d.id ||
                (
                  crypto.randomUUID
                    ? crypto.randomUUID()
                    : String(
                        Date.now() +
                        Math.random()
                      )
                )

            })
          );


        /* -----------------------------------------------
           NORMALIZE IMPORTED DATA
        ----------------------------------------------- */

        data =
          data.map(d => ({

            ...d,

            persentase:
              Number(
                d.persentase
              ) || 0,

            nilaiTransaksi:
              Number(
                d.nilaiTransaksi
              ) || 0,

            nilaiPPN:
              Number(
                d.nilaiPPN
              ) || 0,

            totalTransaksi:
              Number(
                d.totalTransaksi
              ) || 0,

            sisaPPN:
              Number(
                d.sisaPPN
              ) || 0,

            progress:
              normalizeProgress(
                d.progress
              )

          }));


        selectedId =
          data[0]?.id || null;


        saveData();

        render();


        toast(
          "Data berhasil diimport"
        );


      }catch{

        toast(
          "File JSON tidak valid"
        );

      }


      event.target.value = "";

    };


    reader.readAsText(file);

  };


/* =========================================================
   TOAST
========================================================= */

function toast(message){

  const element =
    $("#toast");


  if(!element){

    return;

  }


  element.textContent =
    message;


  element.classList.add(
    "show"
  );


  clearTimeout(
    toast.timer
  );


  toast.timer =
    setTimeout(
      () => {

        element.classList.remove(
          "show"
        );

      },
      2200
    );

}


/* =========================================================
   INITIAL RENDER
========================================================= */

render();