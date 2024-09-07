frappe.views.calendar["Event"] = {
	field_map: {
		"start": "starts_on",
		"end": "ends_on",
		"id": "name",
		"allDay": "all_day",
		"title": "subject",
		"status": "event_type",
		"color": "color"
	},
	style_map: {
		"Public": "success",
		"Private": "info"
	},
	get_events_method: "frappe.desk.doctype.event.event.get_events",
	onload: function (listview){
	}
}
frappe.views.calendar["Event"].onload = function() {
	// El código que deseas ejecutar cuando se carga la vista de calendario
};

setTimeout(()=>{

	// $(".custom-actions").append(`<button class="btn btn-sm btn-default" id="btnFiltro">Sala Norte</button>`)

	$(document).on("click","#btnFiltro",async 	function () {

		const get_filtro = await frappe.db.get_list("List Filter",{
			filters:[["filters","LIKE","%Auditorio%"]],
			fields:["*"],
			limit:"None"
		})

		var name = ""

		if(get_filtro.length > 0){

			name = get_filtro[0].name

		}else{

			const insert = await frappe.db.insert({
				doctype:"List Filter",
				filters:JSON.stringify([["Event","sala_de_reunion","=","Auditorio",false]]),
				for_user: "",
				filter_name: "FILTRO AUDITORIO",
				reference_doctype: "Event"
			})

			if(insert.name){

				name = insert.name

			}
		}

		$(`[data-name='${name}'`)[0].children[0].click()

	})


},1000)

