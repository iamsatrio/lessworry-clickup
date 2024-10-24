const axios = require('axios');
const moment = require('moment');

const config = require('../config');
const asyncFilter = require('../utils/filterAsync');
const mongo = require('./mongo');


const webhook_cf_id = "a003363d-a9ab-4acf-a33b-93b4ae5fd430"
const epic_release_cf_id = "dccb4f61-d762-4403-b560-b452216e34d2"
const theme_cf_id = "71aa8337-49a5-4ba8-986e-409b46049e4e"
const quarter_cf_id = "ecb1c819-265d-42bb-918b-bc73d7df93c6"

const list_master_stock_ho = "901604673187"
const ho_item_name_cf_id = "a3431d54-97ed-4af5-a3fd-02e6f22f1146"
const ho_quantity_cf_id = "9f792dbb-003b-4052-86f9-444896ac3548"

const ho_inbound_stock_cf_id = "3a755599-00a3-41d1-bcd3-907b4b0dbe13"
const ho_outbound_stock_cf_id = "69adcc14-a0f2-4aee-b9cb-e6f956ab52f0"

const outlet_cf_id = "71e09edd-64a4-4265-9569-dc8656ad7bd3"


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


// untuk EPIC RELEASE, REVIEWER & PM ketika buat subtask
async function subtaskSync(payload) {
    try {
        let task = payload
        let parent = (task.parent) ? task.parent : false;
        if (!parent) return 'NO'

        parent = await axios({
            method: "GET",
            url: `https://api.clickup.com/api/v2/task/${parent}`
        });
        parent = parent.data
        
        
        // Set epic release from parent task
        let epic_release = await asyncFilter(parent.custom_fields, async (i) => {
            return i.id == epic_release_cf_id;
        });
        console.log(epic_release[0].value);
        if (typeof epic_release[0].value !== 'undefined' && epic_release[0].value) {
            console.log('YEEY');
            await axios({
                method: "POST",
                url: `https://api.clickup.com/api/v2/task/${task.id}/field/${epic_release_cf_id}`,
                data: {
                    "value": epic_release[0].value
                }
            });
        }

         // Set pm from parent task
        // let pm = await asyncFilter(parent.custom_fields, async (i) => {
        //     return i.id == pm_cf_id;
        // });
        // console.log(pm[0].value);
        // if (typeof pm[0].value !== 'undefined' && pm[0].value) {
        //     console.log('YOOY');
        //     await axios({
        //         method: "POST",
        //         url: `https://api.clickup.com/api/v2/task/${task.id}/field/${pm_cf_id}`,
        //         data: {
        //             "value": {add: [pm[0].value[0].id]}
        //         }
        //     });
        // }

         // Set reviewer from parent task
        // let reviewer = await asyncFilter(parent.custom_fields, async (i) => {
        //     return i.id == reviewer_cf_id;
        // });
        // console.log(reviewer[0].value);
        // if (typeof reviewer[0].value !== 'undefined' && reviewer[0].value) {
        //     console.log('YUUY');
        //     await axios({
        //         method: "POST",
        //         url: `https://api.clickup.com/api/v2/task/${task.id}/field/${reviewer_cf_id}`,
        //         data: {
        //             "value": {add: [reviewer[0].value[0].id]}
        //         }
        //     });
        // }

        
         // Set quarter from parent task
        let quarter = await asyncFilter(parent.custom_fields, async (i) => {
            return i.id == quarter_cf_id;
        });
        console.log(quarter[0].type_config.options[quarter[0].value].id);
        if (typeof quarter[0].type_config.options[quarter[0].value].id !== 'undefined' && quarter[0].type_config.options[quarter[0].value].id) {
            console.log('YAAY');
            await axios({
                method: "POST",
                url: `https://api.clickup.com/api/v2/task/${task.id}/field/${quarter_cf_id}`,
                data: {
                    "value": quarter[0].type_config.options[quarter[0].value].id
                }
            });
        }

        // Set theme from parent task
        let theme = await asyncFilter(parent.custom_fields, async (i) => {
            return i.id == theme_cf_id;
        });
        console.log(theme[0].type_config.options[theme[0].value].id);
        if (typeof theme[0].type_config.options[theme[0].value].id !== 'undefined' && theme[0].type_config.options[theme[0].value].id) {
            console.log('YIIY');
            await axios({
                method: "POST",
                url: `https://api.clickup.com/api/v2/task/${task.id}/field/${theme_cf_id}`,
                data: {
                    "value": theme[0].type_config.options[theme[0].value].id
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


async function inboundStockHO(payload) {
    try {
        let task = payload
        // console.log(task);
        
        ////Get custom field Nama Barang
        let item_name = await asyncFilter(task.custom_fields, async (i) => {
            return i.id == ho_item_name_cf_id;
        });
        item_name = item_name[0].type_config.options[item_name[0].value].name;
        console.log("===========================");
        console.log(item_name);
        console.log("===========================");
        ////Get custom field Jumlah Barang
        let quantity = await asyncFilter(task.custom_fields, async (i) => {
            return i.id == ho_quantity_cf_id;
        });
        quantity = quantity[0].value;
        console.log("===========================");
        console.log(quantity);
        console.log("===========================");
        ////Get List Master Stock HO
        masterStock = await axios({
            method: "GET",
            url: `https://api.clickup.com/api/v2/list/${list_master_stock_ho}/task`
        });
        ////Get task List HO based on Nama Barang
        let ho_item = await asyncFilter(masterStock.data.tasks, async (i) => {
            return i.name == item_name;
        });

        //Get latest Stok Masuk on Master Stock HO
        let latest_inbound_stock_ho = await asyncFilter(ho_item[0].custom_fields, async (i) => {
            return i.id == ho_inbound_stock_cf_id;
        });
        latest_inbound_stock_ho = latest_inbound_stock_ho[0].value;
        console.log("===========================");
        console.log(parseInt(latest_inbound_stock_ho))
        console.log("===========================");
        console.log(parseInt(quantity));
        
            await axios({
                method: "POST",
                url: `https://api.clickup.com/api/v2/task/${ho_item[0].id}/field/${ho_inbound_stock_cf_id}`,
                data: {
                    "value": parseInt(latest_inbound_stock_ho)+parseInt(quantity)
                }
            });

        return 'OK'
    } catch (error) {
        console.log("====== Start Err ClickUp =====")
        console.log(error)
        console.log("====== End Err ClickUp =====")
    }
}

module.exports = {
    dateSync,
    subtaskSync,
    inboundStockHO
}
