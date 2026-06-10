const axios = require('axios');
const moment = require('moment');

const config = require('../config');
const asyncFilter = require('../utils/filterAsync');
const mongo = require('./mongo');


const webhook_cf_id = "a003363d-a9ab-4acf-a33b-93b4ae5fd430"
const item_name_cf_id = "a3431d54-97ed-4af5-a3fd-02e6f22f1146"
const quantity_cf_id = "9f792dbb-003b-4052-86f9-444896ac3548"
const master_stock_ho_cf_id = "901604673187"
const inbound_stock_cf_id = "3a755599-00a3-41d1-bcd3-907b4b0dbe13"
const outbound_stock_cf_id = "69adcc14-a0f2-4aee-b9cb-e6f956ab52f0"

const outlet_cf_id = "71e09edd-64a4-4265-9569-dc8656ad7bd3"

const kemang_outlet_id = "ce56316b-59b7-402b-850a-82760490297c"
const cipete_outlet_id = "f74f96d9-9559-4e08-9587-75b5b347513e"
const hampton_outlet_id = "78c55fd2-da99-4f12-ad8e-cade70642c04"
const tebet_outlet_id = "681777f8-c498-4668-87d1-122badc133bd"
const lebak_bulus_outlet_id = "554cacb6-a374-44ed-827f-1ffe28574310"
const fatmawati_outlet_id = "21751bd5-0339-46b5-909d-7dd09d4c7bc2"
const pondok_indah_outlet_id = "896e042a-1adc-4206-9a6d-994eda0ea126"
const jati_padang_outlet_id = "092aad61-9ed5-4f58-8d16-5364ed6cae6c"
const park_serpong_outlet_id = "13d04d47-cabb-4fd2-b612-afc0cfa7bb5f"
const jagakarsa_outlet_id = "35a46708-0b79-4e15-9cfd-b19eb77e5da6"
const kain_wangi_pamulang_outlet_id = "3e8f17c7-eac7-4053-a3b0-3b96d377efd1"
const ho_outlet_id = "058a48e5-a33d-43b5-82e3-7f2f5a25405d"


axios.defaults.headers.common['Authorization'] = config.clickupToken;
axios.defaults.headers.post['Content-Type'] = 'application/json';

async function dateSync(payload, type) {
    try {
        let task = payload;
        let due_date = moment.unix(task.due_date) || false;
        let start_date = moment.unix(task.start_date) || false;
        let pointer = (task.parent) ? task.parent : false;
        let duration = parseInt(moment.duration(due_date.diff(start_date)).asDays());

        while (pointer) {
            let parent = await axios({
                method: "GET",
                url: `https://api.clickup.com/api/v2/task/${pointer}`
            });
            parent = parent.data

            let parent_start_date = moment.unix(parent.start_date) || false;
            let parent_due_date = moment.unix(parent.due_date) || false;

            let duration_start_date = (parent_start_date) ? moment.duration(parent_start_date.diff(start_date)).asDays() : false;
            let duration_due_date = (parent_due_date) ? moment.duration(parent_due_date.diff(due_date)).asDays() : false;

            if (parent_due_date && parent_due_date > due_date && parent_due_date.unix() > 0) {
                due_date = parent_due_date
            }
            if (parent_start_date && parent_start_date < start_date && parent_start_date.unix() > 0) {
                start_date = parent_start_date
            }

            let cf_updated = await axios({
                method: "POST",
                url: `https://api.clickup.com/api/v2/task/${pointer}/field/${webhook_cf_id}`,
                data: {
                    "value": 1
                }
            });

            if (cf_updated) {
                let date_payload = {};
                if (due_date && due_date.unix() > 0 && duration_due_date && duration_due_date !== 0) date_payload.due_date = due_date.unix();
                if (start_date && start_date.unix() > 0 && duration_start_date && duration_start_date !== 0) date_payload.start_date = start_date.unix();
                if (date_payload.due_date || date_payload.start_date) {
                    let date_updated = await axios({
                        method: "PUT",
                        url: `https://api.clickup.com/api/v2/task/${pointer}`,
                        data: date_payload
                    });
                    await axios({
                        method: "DELETE",
                        url: `https://api.clickup.com/api/v2/task/${pointer}/field/${webhook_cf_id}`
                    });
                }
            }

            pointer = parent.parent
        }

        return 'OK'
    } catch (error) {
        console.log("====== Start Err ClickUp =====")
        console.log(error)
        console.log("====== End Err ClickUp =====")
    }
}

async function inboundStock(payload) {
    try {
        let task = payload
        // console.log(task);

        let master_stock_cf_id = "";

        ////Get custom field Outlet
        let outlet = await asyncFilter(task.custom_fields, async (i) => {
            return i.id == outlet_cf_id;
        });
        outlet = outlet[0].type_config.options[outlet[0].value].name;

        console.log("===========================");
        console.log(outlet)
        console.log("===========================");

        if (typeof outlet !== 'undefined' && outlet) {
            if (outlet == "HO") {
                master_stock_cf_id = master_stock_ho_cf_id
            } else if (outlet == "Bangka") {
                master_stock_cf_id = "901604683755"
            } else if (outlet == "Cipete") {
                master_stock_cf_id = "901604701656"
            } else if (outlet == "Duren Tiga") {
                master_stock_cf_id = "901604701684"
            } else if (outlet == "Tebet") {
                master_stock_cf_id = "901604747336"
            } else if (outlet == "Lebak Bulus") {
                master_stock_cf_id = "901605246824"
            } else if (outlet == "Fatmawati") {
                master_stock_cf_id = "901610200633"
            } else if (outlet == "Pondok Indah") {
                master_stock_cf_id = "901610219828"
            } else if (outlet == "Jati Padang") {
                master_stock_cf_id = "901610219841"
            }
        }
        console.log("===========================");
        console.log(master_stock_cf_id);
        console.log("===========================");

        ////Get custom field Nama Barang
        let item_name = await asyncFilter(task.custom_fields, async (i) => {
            return i.id == item_name_cf_id;
        });
        item_name = item_name[0].type_config.options[item_name[0].value].name;
        console.log("===========================");
        console.log(item_name);
        console.log("===========================");
        ////Get custom field Jumlah Barang
        let quantity = await asyncFilter(task.custom_fields, async (i) => {
            return i.id == quantity_cf_id;
        });
        quantity = quantity[0].value;
        console.log("===========================");
        console.log(quantity);
        console.log("===========================");
        ////Get List Master Stock HO
        masterStock = await axios({
            method: "GET",
            url: `https://api.clickup.com/api/v2/list/${master_stock_cf_id}/task`
        });
        ////Get task List HO based on Nama Barang
        let items = await asyncFilter(masterStock.data.tasks, async (i) => {
            return i.name == item_name;
        });

        //Get latest Stok Masuk on Master Stock
        let latest_inbound_stock = await asyncFilter(items[0].custom_fields, async (i) => {
            return i.id == inbound_stock_cf_id;
        });
        latest_inbound_stock = latest_inbound_stock[0].value;
        console.log("===========================");
        console.log(parseInt(latest_inbound_stock))
        console.log("===========================");
        console.log(parseInt(quantity));

        await axios({
            method: "POST",
            url: `https://api.clickup.com/api/v2/task/${items[0].id}/field/${inbound_stock_cf_id}`,
            data: {
                "value": parseInt(latest_inbound_stock) + parseInt(quantity)
            }
        });


        if (outlet !== "HO") {
            masterStock = await axios({
                method: "GET",
                url: `https://api.clickup.com/api/v2/list/${master_stock_ho_cf_id}/task`
            });
            ////Get task List HO based on Nama Barang
            let ho_items = await asyncFilter(masterStock.data.tasks, async (i) => {
                return i.name == item_name;
            });
            //Get latest Stok Keluar on Master Stock HO
            let latest_outbound_stock_ho = await asyncFilter(ho_items[0].custom_fields, async (i) => {
                return i.id == outbound_stock_cf_id;
            });
            latest_outbound_stock_ho = latest_outbound_stock_ho[0].value;
            console.log("===========================");
            console.log(parseInt(latest_outbound_stock_ho))
            console.log("===========================");
            console.log(parseInt(quantity));

            await axios({
                method: "POST",
                url: `https://api.clickup.com/api/v2/task/${ho_items[0].id}/field/${outbound_stock_cf_id}`,
                data: {
                    "value": parseInt(latest_outbound_stock_ho) + parseInt(quantity)
                }
            });
        }

        return 'OK'
    } catch (error) {
        console.log("====== Start Err ClickUp =====")
        console.log(error)
        console.log("====== End Err ClickUp =====")
    }
}


async function outboundStock(payload) {
    try {
        let task = payload
        console.log(task);

        let master_stock_cf_id = "";

        ////Get custom field Outlet
        let outlet = await asyncFilter(task.custom_fields, async (i) => {
            return i.id == outlet_cf_id;
        });
        outlet = outlet[0].type_config.options[outlet[0].value].name;
        console.log("===========================");
        console.log(outlet)
        console.log("===========================");

        if (typeof outlet !== 'undefined' && outlet) {
            if (outlet == "Bangka") {
                master_stock_cf_id = "901604683755"
            } else if (outlet == "Cipete") {
                master_stock_cf_id = "901604701656"
            } else if (outlet == "Duren Tiga") {
                master_stock_cf_id = "901604701684"
            } else if (outlet == "Tebet") {
                master_stock_cf_id = "901604747336"
            } else if (outlet == "Lebak Bulus") {
                master_stock_cf_id = "901605246824"
            } else if (outlet == "Fatmawati") {
                master_stock_cf_id = "901610200633"
            } else if (outlet == "Pondok Indah") {
                master_stock_cf_id = "901610219828"
            } else if (outlet == "Jati Padang") {
                master_stock_cf_id = "901610219841"
            }
        }
        console.log("===========================");
        console.log(master_stock_cf_id);
        console.log("===========================");

        ////Get custom field Nama Barang
        let item_name = await asyncFilter(task.custom_fields, async (i) => {
            return i.id == item_name_cf_id;
        });
        item_name = item_name[0].type_config.options[item_name[0].value].name;
        console.log("===========================");
        console.log(item_name);
        console.log("===========================");
        ////Get custom field Jumlah Barang
        let quantity = await asyncFilter(task.custom_fields, async (i) => {
            return i.id == quantity_cf_id;
        });
        quantity = quantity[0].value;
        console.log("===========================");
        console.log(quantity);
        console.log("===========================");
        ////Get List Master Stock HO
        masterStock = await axios({
            method: "GET",
            url: `https://api.clickup.com/api/v2/list/${master_stock_cf_id}/task`
        });
        ////Get task List HO based on Nama Barang
        let items = await asyncFilter(masterStock.data.tasks, async (i) => {
            return i.name == item_name;
        });

        //Get latest Stok Masuk on Master Stock
        let latest_outbound_stock = await asyncFilter(items[0].custom_fields, async (i) => {
            return i.id == outbound_stock_cf_id;
        });
        latest_outbound_stock = latest_outbound_stock[0].value;
        console.log("===========================");
        console.log(parseInt(latest_outbound_stock))
        console.log("===========================");
        console.log(parseInt(quantity));

        await axios({
            method: "POST",
            url: `https://api.clickup.com/api/v2/task/${items[0].id}/field/${outbound_stock_cf_id}`,
            data: {
                "value": parseInt(latest_outbound_stock) + parseInt(quantity)
            }
        });
        return 'OK'
    } catch (error) {
        console.log("====== Start Err ClickUp =====")
        console.log(error)
        console.log("====== End Err ClickUp =====")
    }
}

async function purchaseStock(payload) {
    try {
        let task = payload
        // console.log(task);

        let master_stock_cf_id = "";

        ////Get custom field Outlet
        let outlet = await asyncFilter(task.custom_fields, async (i) => {
            return i.id == outlet_cf_id;
        });
        outlet = outlet[0].type_config.options[outlet[0].value].name;

        console.log("===========================");
        console.log(outlet)
        console.log("===========================");

        if (typeof outlet !== 'undefined' && outlet) {
            if (outlet == "Bangka") {
                master_stock_cf_id = "901604683755"
            } else if (outlet == "Cipete") {
                master_stock_cf_id = "901604701656"
            } else if (outlet == "Duren Tiga") {
                master_stock_cf_id = "901604701684"
            } else if (outlet == "Tebet") {
                master_stock_cf_id = "901604747336"
            } else if (outlet == "Lebak Bulus") {
                master_stock_cf_id = "901605246824"
            } else if (outlet == "Fatmawati") {
                master_stock_cf_id = "901610200633"
            } else if (outlet == "Pondok Indah") {
                master_stock_cf_id = "901610219828"
            } else if (outlet == "Jati Padang") {
                master_stock_cf_id = "901610219841"
            }
        }

        console.log("===========================");
        console.log(master_stock_cf_id);
        console.log("===========================");

        ////Get custom field Nama Barang
        let item_name = await asyncFilter(task.custom_fields, async (i) => {
            return i.id == item_name_cf_id;
        });
        item_name = item_name[0].type_config.options[item_name[0].value].name;
        console.log("===========================");
        console.log(item_name);
        console.log("===========================");
        ////Get custom field Jumlah Barang
        let quantity = await asyncFilter(task.custom_fields, async (i) => {
            return i.id == quantity_cf_id;
        });
        quantity = quantity[0].value;
        console.log("===========================");
        console.log(quantity);
        console.log("===========================");
        ////Get List Master Stock HO
        masterStock = await axios({
            method: "GET",
            url: `https://api.clickup.com/api/v2/list/${master_stock_cf_id}/task`
        });
        ////Get task List HO based on Nama Barang
        let items = await asyncFilter(masterStock.data.tasks, async (i) => {
            return i.name == item_name;
        });

        //Get latest Stok Masuk on Master Stock
        let latest_inbound_stock = await asyncFilter(items[0].custom_fields, async (i) => {
            return i.id == inbound_stock_cf_id;
        });
        latest_inbound_stock = latest_inbound_stock[0].value;
        console.log("===========================");
        console.log(parseInt(latest_inbound_stock))
        console.log("===========================");
        console.log(parseInt(quantity));

        await axios({
            method: "POST",
            url: `https://api.clickup.com/api/v2/task/${items[0].id}/field/${inbound_stock_cf_id}`,
            data: {
                "value": parseInt(latest_inbound_stock) + parseInt(quantity)
            }
        });

        return 'OK'
    } catch (error) {
        console.log("====== Start Err ClickUp =====")
        console.log(error)
        console.log("====== End Err ClickUp =====")
    }
}


async function addOutlet(payload) {
    try {
        let task = payload
        console.log("============TASK ID========");
        console.log(task);

        //Get Linked Task Data
        let linkedTaskData = await axios({
            method: "GET",
            url: `https://api.clickup.com/api/v2/task/${linked_task}`
        });
        console.log(linkedTaskData);
        console.log("===========================");
        //Get custom field Outlet from Linked Task Data
        let outlet = await asyncFilter(linkedTaskData.custom_fields, async (i) => {
            return i.id == outlet_cf_id;
        });
        console.log(outlet);
        console.log("===========================");

        outlet_id = outlet[0].type_config.options[outlet[0].value].id;
        outlet_name = outlet[0].type_config.options[outlet[0].value].name;
        console.log("===========================");
        console.log(outlet_id)
        console.log(outlet_name)
        console.log("===========================");

        if (typeof outlet !== 'undefined' && outlet) {
            await axios({
                method: "POST",
                url: `https://api.clickup.com/api/v2/task/${task.id}/field/${outlet_cf_id}`,
                data: {
                    "value": outlet_id
                }
            });
        }

        return 'OK'
    } catch (error) {
        console.log("====== Start Err ClickUp =====")
        console.log(error)
        console.log("====== End Err ClickUp =====")
    }
}


module.exports = {
    dateSync,
    inboundStock,
    outboundStock,
    purchaseStock,
    addOutlet
}
