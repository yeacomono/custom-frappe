frappe.provide('frappe.search');

frappe.ui.Notifications = class Notifications {
	constructor() {
		this.tabs = {};
		this.notification_settings = frappe.boot.notification_settings;
		let discord_validation_users = ["cegaje17@gmail.com",'leonardol@overskull.pe']
		//let discord_validation_users = ["ingaamable@gmail.com","cegaje17@gmail.com",'leonardol@overskull.pe']

		if (discord_validation_users.includes(frappe.user.name)) {
			$(`<div class="circle" id="generalCount" style="background: rgb(81, 114, 206)">0</div>`).insertBefore(".dropdown-notifications");
			$(".circle").css({
				"width": "20px",
				"height": "20px",
				"color":"white",
				"border-radius": "50%", /* Hace que el div sea redondo */
				"display": "flex",
				"justify-content": "center",
				"align-items": "center",
				"font-size": "10px",
				"font-weight": "bold",
				"position": "absolute",
				"margin-left": "21px",
				"z-index": "10"
			});
			$(".notifications-list").css("width","400px")
			this.make();
		} else {
			$(`<div class="circle" id="generalCount" style="background: #242a30">0</div>`).insertBefore(".dropdown-notifications");
			$(".circle").css({
				"width": "20px",
				"height": "20px",
				"color":"white",
				"border-radius": "50%", /* Hace que el div sea redondo */
				"display": "flex",
				"justify-content": "center",
				"align-items": "center",
				"font-size": "10px",
				"font-weight": "bold",
				"position": "absolute",
				"margin-left": "23px"
			});
			$(".notifications-list").css("width","800px")
			this.make();
		}
	}

	make() {
		this.dropdown = $('.navbar').find('.dropdown-notifications').removeClass('hidden');
		this.dropdown_list = this.dropdown.find('.notifications-list');
		this.header_items = this.dropdown_list.find('.header-items');
		this.header_actions = this.dropdown_list.find('.header-actions');
		this.body = this.dropdown_list.find('.notification-list-body');
		this.panel_events = this.dropdown_list.find('.panel-events');
		this.panel_notifications = this.dropdown_list.find('.panel-notifications');

		this.user = frappe.session.user;

		this.setup_headers();
		this.setup_dropdown_events();
	}

	setup_headers() {
		// Add header actions
		// $(`<span class="notification-settings pull-right" data-action="go_to_settings">
		// 	${frappe.utils.icon('setting-gear')}
		// </span>`)
		// 	.on('click', (e) => {
		// 		e.stopImmediatePropagation();
		// 		this.dropdown.dropdown('hide');
		// 		frappe.set_route('Form', 'Notification Settings', frappe.session.user);
		// 	}).appendTo(this.header_actions)
		// 	.attr('title', __("Notification Settings"))
		// 	.tooltip({ delay: { "show": 600, "hide": 100}, trigger: "hover"  });
		//
		// $(`<span class="mark-all-read pull-right" data-action="mark_all_as_read">
		// 	${frappe.utils.icon('mark-as-read')}
		// </span>`)
		// 	.on('click', (e) => this.mark_all_as_read(e))
		// 	.appendTo(this.header_actions)
		// 	.attr('title', __("Mark all as read"))
		// 	.tooltip({ delay: { "show": 600, "hide": 100 }, trigger: "hover" });

		let discord_validation_users = ["ingaamable@gmail.com","cegaje17@gmail.com","leonardol@overskull.pe"]
		if (discord_validation_users.includes(frappe.user.name)) {
			this.categories = [
				{
					label: __("Validaciones"),
					id: "validate_form_gym",
					view: EventsValidationView,
					el: this.panel_events,
				},
				{
					label: __("Notificaciones"),
					id: "notifications",
					view: NotificationsView,
					el: this.panel_events,
				},
			];
		} else {
			this.categories = [
				{
					label: __("Solicitudes de Almacen"),
					id: "todays_events_mu",
					view: EventsDotaView,
					el: this.panel_events,
				},
				{
					label: __("Tarea de Supervisor"),
					id: "todays_events",
					view: EventsTaskView,
					el: this.panel_events,
				},
				{
					label: __("Info Coolers"),
					id: "info_coolers",
					view: EventsCoolersView,
					el: this.panel_events,
				},
				{
					label: __("Solicitud de Materiales"),
					id: "solicitud_materiales_film",
					view: EventsMaterialView,
					el: this.panel_events,
				},
				{
					label: __("Notific.."),
					id: "notifications",
					view: NotificationsView,
					el: this.panel_events,
				},

			];
		}


		let get_headers_html = (item) => {
			let active = item.id == "notifications" ? 'active' : '';

			let html = `<li class="notifications-category ${active}"
					id="${item.id}"
					data-toggle="collapse"
				>${item.label}</li>`;

			return html;
		};

		let navitem = $(`<ul class="notification-item-tabs nav nav-tabs" role="tablist"></ul>`);
		this.categories = this.categories.map(item => {
			item.$tab = $(get_headers_html(item));
			item.$tab.on('click', (e) => {
				e.stopImmediatePropagation();
				this.switch_tab(item);
			});
			navitem.append(item.$tab);

			return item;
		});
		navitem.appendTo(this.header_items);
		this.categories.forEach(category => {
			this.make_tab_view(category);
		});
		this.switch_tab(this.categories[0]);
	}

	switch_tab(item) {
		// Set active tab
		this.categories.forEach((item) => {
			item.$tab.removeClass("active");
		});

		item.$tab.addClass("active");

		// Hide other tabs
		Object.keys(this.tabs).forEach(tab_name => this.tabs[tab_name].hide());
		this.tabs[item.id].show();
	}

	make_tab_view(item) {
		let tabView = new item.view(
			item.el,
			this.dropdown,
			this.notification_settings
		);
		this.tabs[item.id] = tabView;
	}

	mark_all_as_read(e) {
		e.stopImmediatePropagation();
		this.dropdown_list.find('.unread').removeClass('unread');
		frappe.call(
			'frappe.desk.doctype.notification_log.notification_log.mark_all_as_read',
		);
	}

	setup_dropdown_events() {
		this.dropdown.on('hide.bs.dropdown', e => {
			let hide = $(e.currentTarget).data('closable');
			$(e.currentTarget).data('closable', true);
			return hide;
		});

		this.dropdown.on('click', e => {
			$(e.currentTarget).data('closable', true);
		});
	}
};


frappe.ui.notifications = {
	get_notification_config() {
		return frappe.xcall('frappe.desk.notifications.get_notification_info').then(r => {
			frappe.ui.notifications.config = r;
			return r;
		});
	},

	show_open_count_list(doctype) {
		if (!frappe.ui.notifications.config) {
			this.get_notification_config().then(() => {
				this.route_to_list_with_filters(doctype);
			});
		} else {
			this.route_to_list_with_filters(doctype);
		}
	},

	route_to_list_with_filters(doctype) {
		let filters = frappe.ui.notifications.config['conditions'][doctype];
		if (filters && $.isPlainObject(filters)) {
			if (!frappe.route_options) {
				frappe.route_options = {};
			}
			$.extend(frappe.route_options, filters);
		}
		frappe.set_route('List', doctype);
	}
};

class BaseNotificationsView {
	constructor(wrapper, parent, settings) {
		// wrapper, max_length
		this.wrapper = wrapper;
		this.parent = parent;
		this.settings = settings;
		this.max_length = 20;
		this.container = $(`<div></div>`).appendTo(this.wrapper);
		this.make();
	}

	show() {
		this.container.show();
	}

	hide() {
		this.container.hide();
	}
}

class NotificationsView extends BaseNotificationsView {
	make() {
		this.notifications_icon = this.parent.find('.notifications-icon');
		this.notifications_icon.attr("title", __('Notifications')).tooltip(
			{ delay: { "show": 600, "hide": 100},  trigger: "hover" }
		);

		this.setup_notification_listeners();
		this.get_notifications_list(this.max_length).then(list => {
			this.dropdown_items = list;
			this.render_notifications_dropdown();
			if (this.settings.seen == 0) {
				this.toggle_notification_icon(false);
			}
		});

	}

	update_dropdown() {
		this.get_notifications_list(1).then(r => {
			let new_item = r[0];
			this.dropdown_items.unshift(new_item);
			if (this.dropdown_items.length > this.max_length) {
				this.container
					.find('.recent-notification')
					.last()
					.remove();
				this.dropdown_items.pop();
			}

			this.insert_into_dropdown();
		});
	}

	change_activity_status() {
		if (this.container.find('.activity-status')) {
			this.container.find('.activity-status').replaceWith(
				`<a class="recent-item text-center text-muted"
					href="/app/List/Notification Log">
					<div class="full-log-btn">${__('View Full Log')}</div>
				</a>`
			);
		}
	}

	mark_as_read(docname, $el) {
		frappe.call(
			'frappe.desk.doctype.notification_log.notification_log.mark_as_read',
			{ docname: docname }
		).then(() => {
			$el.removeClass('unread');
		});
	}

	insert_into_dropdown() {
		let new_item = this.dropdown_items[0];
		let new_item_html = this.get_dropdown_item_html(new_item);
		$(new_item_html).prependTo(this.container);
		this.change_activity_status();
	}

	get_dropdown_item_html(field) {
		let doc_link = this.get_item_link(field);

		let read_class = field.read ? '' : 'unread';
		let message = field.subject;

		let title = message.match(/<b class="subject-title">(.*?)<\/b>/);
		message = title ? message.replace(title[1], frappe.ellipsis(strip_html(title[1]), 100)) : message;

		let timestamp = frappe.datetime.comment_when(field.creation);
		let message_html = `<div class="message">
			<div>${message}</div>
			<div class="notification-timestamp text-muted">
				${timestamp}
			</div>
		</div>`;

		let user = field.from_user;
		let user_avatar = frappe.avatar(user, 'avatar-medium user-avatar');

		let item_html =
			$(`<a class="recent-item notification-item ${read_class}"
				href="${doc_link}"
				data-name="${field.name}"
			>
				<div class="notification-body">
					${user_avatar}
					${message_html}
				</div>
				<div class="mark-as-read" title="${__("Mark as Read")}">
				</div>
			</a>`);

		if (!field.read) {
			let mark_btn = item_html.find(".mark-as-read");
			mark_btn.tooltip({ delay: { "show": 600, "hide": 100 }, trigger: "hover" });
			mark_btn.on('click', (e) => {
				e.preventDefault();
				e.stopImmediatePropagation();
				this.mark_as_read(field.name, item_html);
			});

			item_html.on('click', () => {
				this.mark_as_read(field.name, item_html);
			});
		}

		return item_html;
	}

	render_notifications_dropdown() {
		if (this.settings && !this.settings.enabled) {
			this.container.html(`<li class="recent-item notification-item">
				<span class="text-muted">
					${__('Notifications Disabled')}
				</span></li>`);
		} else {
			if (this.dropdown_items.length) {
				this.container.empty();
				this.dropdown_items.forEach(field => {
					this.container.append(this.get_dropdown_item_html(field));
				});
				this.container.append(`<a class="list-footer"
					href="/app/List/Notification Log">
						<div class="full-log-btn">${__('See all Activity')}</div>
					</a>`);
			} else {
				this.container.append($(`<div class="notification-null-state">
					<div class="text-center">
						<img src="/assets/frappe/images/ui-states/notification-empty-state.svg" alt="Generic Empty State" class="null-state">
						<div class="title">${__('No New notifications')}</div>
						<div class="subtitle">
							${__('Looks like you haven’t received any notifications.')}
					</div></div></div>`));
			}
		}
	}

	get_notifications_list(limit) {
		return frappe.db.get_list('Notification Log', {
			fields: ['*'],
			limit: limit,
			order_by: 'creation desc'
		});
	}

	get_item_link(notification_doc) {
		const link_doctype =
			notification_doc.type == 'Alert' ? 'Notification Log' : notification_doc.document_type;
		const link_docname =
			notification_doc.type == 'Alert' ? notification_doc.name : notification_doc.document_name;
		return frappe.utils.get_form_link(
			link_doctype,
			link_docname
		);
	}

	toggle_notification_icon(seen) {
		this.notifications_icon.find('.notifications-seen').toggle(seen);
		this.notifications_icon.find('.notifications-unseen').toggle(!seen);
	}

	toggle_seen(flag) {
		frappe.call(
			'frappe.desk.doctype.notification_settings.notification_settings.set_seen_value',
			{
				value: cint(flag),
				user: frappe.session.user
			}
		);
	}

	setup_notification_listeners() {
		frappe.realtime.on('notification', () => {
			this.toggle_notification_icon(false);
			this.update_dropdown();
		});

		frappe.realtime.on('indicator_hide', () => {
			this.toggle_notification_icon(true);
		});

		this.parent.on('show.bs.dropdown', () => {
			this.toggle_seen(true);
			if (this.notifications_icon.find('.notifications-unseen').is(':visible')) {
				this.toggle_notification_icon(true);
				frappe.call(
					'frappe.desk.doctype.notification_log.notification_log.trigger_indicator_hide'
				);
			}
		});

	}
}

class EventsView extends BaseNotificationsView {
	make() {
		let today = frappe.datetime.get_today();
		frappe.xcall('frappe.desk.doctype.event.event.get_events', {
			start: today,
			end: today
		}).then(event_list => {
			this.render_events_html(event_list);
		});
	}

	render_events_html(event_list) {
		let html = '';
		if (event_list.length) {
			let get_event_html = (event) => {
				let time = __("All Day");
				if (!event.all_day) {
					let start_time = frappe.datetime.get_time(event.starts_on);
					let days_diff = frappe.datetime.get_day_diff(event.ends_on, event.starts_on);
					let end_time = frappe.datetime.get_time(event.ends_on);
					if (days_diff > 1) {
						end_time = __("Rest of the day");
					}
					time = `${start_time} - ${end_time}`;
				}

				// REDESIGN-TODO: Add Participants to get_events query
				let particpants = '';
				if (event.particpants) {
					particpants = frappe.avatar_group(event.particpants, 3);
				}

				// REDESIGN-TODO: Add location to calendar field
				let location = '';
				if (event.location) {
					location = `, ${event.location}`;
				}

				return `<a class="recent-item event" href="/app/event/${event.name}">
					<div class="event-border" style="border-color: ${event.color}"></div>
					<div class="event-item">
						<div class="event-subject">${event.subject}</div>
						<div class="event-time">${time}${location}</div>
						${particpants}
					</div>
				</a>`;
			};
			html = event_list.map(get_event_html).join('');
		} else {
			html = `
				<div class="notification-null-state">
					<div class="text-center">
					<img src="/assets/frappe/images/ui-states/event-empty-state.svg" alt="Generic Empty State" class="null-state">
					<div class="title">${__('No Upcoming Events')}</div>
					<div class="subtitle">
						${__('There are no upcoming events for you.')}
				</div></div></div>
			`;
		}

		this.container.html(html);
	}
}

class EventsDotaView extends BaseNotificationsView {
	async make() {

		let icon_noti_material = document.getElementsByClassName('circleMaterialRequest')

		if ( icon_noti_material.length === 0 ) {
			$(`<div class="circleMaterialRequest">0</div>`).insertBefore("#todays_events_mu");
			$(".circleMaterialRequest").css({
				"margin-top": "5px",
				"color":"black",
				"width": "20px",
				"height": "20px",
				"background-color": "white",
				"border-radius": "50%",
				"display": "flex",
				"justify-content": "center",
				"align-items": "center",
				"font-size": "10px",
				"font-weight": "bold",
			});
		}

		this.setup_notification_listeners2();

		if ( !frappe.user_roles.includes('Administrador de agencia') ) {
			this.render_events_html2([]);
		}

		this.render_events_html2([]);

		return false

		const obtener_solicitud_materiales = await frappe.db.get_list('Material Request', {
			'filters':[
				['docstatus','=',1],
				['status','=','Transferred'],
				['owner','=',frappe.user.name],
				['numero_orden','!=','" "'],
				['numero_orden','!=',null],
				['a','=','Sin confirmar'],
				['material_request_type','=',"Material Transfer"],
			],
			'limit':'None',
			fields: ['name','propósito_de_transferencia','numero_orden','a']
		})

		if ( obtener_solicitud_materiales.length > 0 ) {

			let solicitudesNotificacion = []

			for ( let solicitud of obtener_solicitud_materiales ) {

				let estado =  await $.ajax({
					"type":"POST",
					"url":"https://webservices.shalom.com.pe/empresarial/ordenServicio/estado",
					"data": {
						"guia": solicitud.numero_orden.trim()
					},
				})

				if ( estado.success ) {
					if ( estado.data === "ENTREGADO" ) {
						solicitudesNotificacion.push( solicitud )
					}
				}

			}

			if ( solicitudesNotificacion.length > 0 ) {

				const synth = window.speechSynthesis
				let voices = []
				voices = await synth.getVoices()

				let utterThis = new SpeechSynthesisUtterance("tiene solicitudes pendientes de confirmar")
				utterThis.voice = voices[1]

				utterThis.pitch = 1
				utterThis.rate = 1
				utterThis.volume = 2
				utterThis.onstart = (e) => {
				}
				utterThis.onerror = (e) => {
				}
				synth.speak(utterThis)

				const audioContext = new (window.AudioContext || window.webkitAudioContext)();
				const oscillator = audioContext.createOscillator();
				oscillator.connect(audioContext.destination);
				oscillator.type = 'sine';
				oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
				oscillator.start();
				oscillator.stop(audioContext.currentTime + 0.5);

				//AGREGAR A GENERAL solicitudesNotificacion.length

				let noti1 = document.getElementsByClassName('circleMaterialRequest')

				if ( noti1.length == 0 ) {
					$(`<div class="circleMaterialRequest" style="background: white">${solicitudesNotificacion.length}</div>`).insertBefore("#todays_events_mu");
				} else {
					let nueva_cantidad = parseInt( solicitudesNotificacion.length )
					noti1[0].textContent = nueva_cantidad
				}

				$(".circleMaterialRequest").css({
					"margin-top":"2px",
					"width": "20px",
					"height": "20px",
					"background-color": "#e24c4c",
					"border-radius": "50%", /* Hace que el div sea redondo */
					"display": "flex",
					"justify-content": "center",
					"align-items": "center",
					"color": "white",
					"font-size": "10px",
					"font-weight": "bold",
				});

				let idGeneral = document.getElementById('generalCount')
				let cantidad_material = parseInt( document.getElementsByClassName('circleMaterialRequest')[0].textContent )
				let cantidad_task = parseInt( document.getElementsByClassName('circleTask')[0].textContent )
				let cantidad_cooler = parseInt( document.getElementsByClassName('circleCooler')[0].textContent )
				let cantidad_film = parseInt( document.getElementsByClassName('circleMaterialFilm')[0].textContent )
				idGeneral.textContent = cantidad_material + cantidad_task + cantidad_cooler + cantidad_film
				if ( idGeneral.textContent > 0 ) {
					$(".circle").css({
						"background-color": "#e24c4c",
						"color": "white",
					});
				} else {
					idGeneral.textContent = 0
					$(".circle").css({
						"background-color": "#242a30",
						"color": "white",
					});
				}

				this.render_events_html2(solicitudesNotificacion);

			} else {

				$(".circleMaterialRequest").css({
					"color":"#000",
					"background-color": "white",
				});

			}

		} else {
			$(".circleMaterialRequest").css({
				"background-color": "white",
				"color": "black",
			});
			document.getElementsByClassName('circleMaterialRequest')[0].textContent = 0
		}

		this.render_events_html2(obtener_solicitud_materiales);
	}
	async render_events_html2(event_list) {

		let html = '';
		let count = 0
		if (event_list.length) {
			let get_event_html = (event) => {

				let user = event_list.from_user;
				let user_avatar = frappe.avatar(user, 'avatar-medium user-avatar');

				return `<a class="recent-item event" href="/app/material-request/${event.name}">
					<div class="event-border" style="border-color: red"></div>
					<div class="notification-body ml-3">
						${user_avatar}
					</div>
					<div class="event-item ml-1">
						<div class="event-subject" style="font-weight: bold; color: red">${event.propósito_de_transferencia}</div>
						<span style="font-weight: bold">Sus materiales ya se encuentran en su agencia</span><br>
						<span>Debe indicar si esta conforme con los materiales que se le envio</span>
					</div>
				</a>`;
			};
			html = event_list.map(get_event_html).join('');
		} else {
			html = `
				<div class="notification-null-state">
					<div class="text-center">
					<img src="/assets/frappe/images/ui-states/event-empty-state.svg" alt="Generic Empty State" class="null-state">
					<div class="title">${__('Las notificaciones se encuentran inhabilitadas')}</div>
					<div class="subtitle">
						${__('.')}
				</div></div></div>
			`;

			// let idGeneral = document.getElementById('generalCount')
			// let cantidad_material = parseInt( document.getElementsByClassName('circleMaterialRequest')[0].textContent )
			// let cantidad_task = parseInt( document.getElementsByClassName('circleTask')[0].textContent )
			// let cantidad_cooler = parseInt( document.getElementsByClassName('circleCooler')[0].textContent )
			// idGeneral.textContent = cantidad_material + cantidad_task + cantidad_cooler
			//
			// if ( idGeneral.textContent > 0 ) {
			// 	$(".circle").css({
			// 		"background-color": "#e24c4c",
			// 		"color": "white",
			// 	});
			// } else {
			// 	idGeneral.textContent = 0
			// 	$(".circle").css({
			// 		"background-color": "#242a30",
			// 		"color": "white",
			// 	});
			// }
		}

		this.container.html(html);

	}
	setup_notification_listeners2() {
		frappe.realtime.on('notification', () => {

			this.make()

		});

	}
}

class EventsTaskView extends BaseNotificationsView {
	async soundAndVoice() {
		const synth = window.speechSynthesis
		let voices = []
		voices = await synth.getVoices()

		let utterThis = new SpeechSynthesisUtterance("Tiene tareas pendientes en programacion de supervisores")
		utterThis.voice = voices[1]

		utterThis.pitch = 1
		utterThis.rate = 1
		utterThis.volume = 1
		utterThis.onstart = (e) => {
		}
		utterThis.onerror = (e) => {
		}
		synth.speak(utterThis)

		const audioContext = new (window.AudioContext || window.webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		oscillator.connect(audioContext.destination);
		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
		oscillator.start();
		oscillator.stop(audioContext.currentTime + 0.5);
	}
	async make() {

		let icon_noti_task = document.getElementsByClassName('circleTask')

		if ( icon_noti_task.length === 0 ) {
			$(`<div class="circleTask">0</div>`).insertBefore("#todays_events");
			$(".circleTask").css({
				"margin-top": "2px",
				"color":"black",
				"width": "20px",
				"height": "20px",
				"background-color": "white",
				"border-radius": "50%",
				"display": "flex",
				"justify-content": "center",
				"align-items": "center",
				"font-size": "10px",
				"font-weight": "bold",
			});
		}

		if ( frappe.user_roles.includes( 'Supervisor Nacional' )) {

			this.setup_notification_listeners2();

			const obtener_zona = await frappe.db.get_list('User Permission', {
				'filters':[
					['allow','=','Zonas Nacional'],
					['user','=',frappe.user.name],
				],
				'limit':'None',
				fields: ['for_value']
			})

			if ( !obtener_zona.length ) {
				await this.render_events_html2([])
				return false
			}

			const obtener_documentos_por_zona = await frappe.db.get_list('Programacion de Supervisores', {
				'filters':[
					['zonaa_nacional','=',obtener_zona[0].for_value],
				],
				'limit':'None',
				fields: ['name']
			})

			if ( !obtener_documentos_por_zona.length ) {
				await this.render_events_html2([])
				return false
			}

			let arrayNames = []

			for ( let name of obtener_documentos_por_zona ) {
				arrayNames.push(name.name)
			}

			const obtener_tareas_supervision = await frappe.db.get_list('Tareas de Supervision', {
				'filters':[
					['parent','IN',arrayNames],
					['estado','=','Pendiente']
				],
				'limit':'None',
				fields: ['parent','fecha','asunto']
			})

			if ( !obtener_tareas_supervision.length ) {
				await this.render_events_html2([])
				$(".circleTask").css({
					"background-color": "white",
					"color": "black",
				});
				document.getElementsByClassName('circleTask')[0].textContent = 0
				return false
			}

			let arrayTask = []

			for ( let task of obtener_tareas_supervision ) {

				let fecha_actual = moment().format("YYYY-MM-DD")

				let fecha1 = new Date( fecha_actual );
				let fecha2 = new Date( task.fecha );

				let diferencia = Math.abs( fecha1.getTime() - fecha2.getTime() );
				let diasDeDiferencia = diferencia / 1000 / 60 / 60 / 24;

				if ( diasDeDiferencia > 0 && diasDeDiferencia < 3 && fecha1 < fecha2 ) {
					task.estado = 'por vencer'
					arrayTask.push( task )
				} else if ( diasDeDiferencia > 0 && fecha1 > fecha2 ) {
					task.estado = 'vencida'
					arrayTask.push( task )
				}

			}

			if ( !arrayTask.length ) {
				$(".circleTask").css({
					"background-color": "white",
					"color": "black",
				});
				document.getElementsByClassName('circleTask')[0].textContent = 0
				await this.render_events_html2([])
				return false
			}

			await this.soundAndVoice()

			$(".circleTask").css({
				"background-color": "#e24c4c",
			});

			let noti1 = document.getElementsByClassName('circleTask')

			if ( noti1.length == 0 ) {
				$(`<div class="circleTask" style="background: white">${arrayTask.length}</div>`).insertBefore("#todays_events");
			} else {
				let nueva_cantidad = parseInt( arrayTask.length )
				noti1[0].textContent = nueva_cantidad
			}

			$(".circleTask").css({
				"margin-top":"2px",
				"width": "20px",
				"height": "20px",
				"background-color": "#e24c4c",
				"border-radius": "50%", /* Hace que el div sea redondo */
				"display": "flex",
				"justify-content": "center",
				"align-items": "center",
				"color": "white",
				"font-size": "10px",
				"font-weight": "bold",
			});

			let idGeneral = document.getElementById('generalCount')
			let cantidad_material = parseInt( document.getElementsByClassName('circleMaterialRequest')[0].textContent )
			let cantidad_task = parseInt( document.getElementsByClassName('circleTask')[0].textContent )
			let cantidad_cooler = parseInt( document.getElementsByClassName('circleCooler')[0].textContent )
			let cantidad_film = parseInt( document.getElementsByClassName('circleMaterialFilm')[0].textContent )
			idGeneral.textContent = cantidad_material + cantidad_task + cantidad_cooler + cantidad_film
			if ( idGeneral.textContent > 0 ) {
				$(".circle").css({
					"background-color": "#e24c4c",
					"color": "white",
				});
			} else {
				idGeneral.textContent = 0
				$(".circle").css({
					"background-color": "#242a30",
					"color": "white",
				});
			}

			this.render_events_html2(arrayTask);

		}

	}
	async render_events_html2(event_list) {

		let html = '';
		let count = 0
		if (event_list.length) {
			let get_event_html = (event) => {

				let user = event_list.from_user;
				let user_avatar = frappe.avatar(user, 'avatar-medium user-avatar');

				return `<a class="recent-item event" href="/app/programacion-de-supervisores/${event.parent}">
					<div class="event-border" style="border-color: red"></div>
					<div class="notification-body ml-3">
						${user_avatar}
					</div>
					<div class="event-item ml-1">
						<div class="event-subject" style="font-weight: bold; color: red">Fecha de Cumplimiento: ${event.fecha}</div>
						<span style="font-weight: bold">Tiene tarea ${event.estado} en la Programación de Supervisor ${event.parent} - ${event.asunto}</span><br>
					</div>
				</a>`;
			};
			html = event_list.map(get_event_html).join('');
		} else {
			html = `
				<div class="notification-null-state">
					<div class="text-center">
					<img src="/assets/frappe/images/ui-states/event-empty-state.svg" alt="Generic Empty State" class="null-state">
					<div class="title">${__('No hay tareas por vencer')}</div>
					<div class="subtitle">
						${__('.')}
				</div></div></div>
			`;

			let idGeneral = document.getElementById('generalCount')
			let cantidad_material = parseInt( document.getElementsByClassName('circleMaterialRequest')[0].textContent )
			let cantidad_task = parseInt( document.getElementsByClassName('circleTask')[0].textContent )
			let cantidad_cooler = parseInt( document.getElementsByClassName('circleCooler')[0].textContent )
			let cantidad_film = parseInt( document.getElementsByClassName('circleMaterialFilm')[0].textContent )
			idGeneral.textContent = cantidad_material + cantidad_task + cantidad_cooler + cantidad_film
			if ( idGeneral.textContent > 0 ) {
				$(".circle").css({
					"background-color": "#e24c4c",
					"color": "white",
				});
			} else {
				idGeneral.textContent = 0
				$(".circle").css({
					"background-color": "#242a30",
					"color": "white",
				});
			}
		}

		this.container.html(html);

	}
	setup_notification_listeners2() {
		frappe.realtime.on('notification', () => {
			this.make()
		});

	}
}

class EventsCoolersView extends BaseNotificationsView {
	async soundAndVoice() {
		const synth = window.speechSynthesis
		let voices = []
		voices = await synth.getVoices()

		let utterThis = new SpeechSynthesisUtterance("Tiene culers sin rotar")
		utterThis.voice = voices[1]

		utterThis.pitch = 1
		utterThis.rate = 1
		utterThis.volume = 1
		utterThis.onstart = (e) => {
		}
		utterThis.onerror = (e) => {
		}
		synth.speak(utterThis)

		const audioContext = new (window.AudioContext || window.webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		oscillator.connect(audioContext.destination);
		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
		oscillator.start();
		oscillator.stop(audioContext.currentTime + 0.5);
	}
	async make() {

		let icon_Cooler_task = document.getElementsByClassName('circleCooler')

		if ( icon_Cooler_task.length === 0 ) {
			$(`<div class="circleCooler">0</div>`).insertBefore("#info_coolers");
			$(".circleCooler").css({
				"margin-top": "2px",
				"color":"black",
				"width": "20px",
				"height": "20px",
				"background-color": "white",
				"border-radius": "50%",
				"display": "flex",
				"justify-content": "center",
				"align-items": "center",
				"font-size": "10px",
				"font-weight": "bold",
			});
		}

		if ( frappe.user.name.includes('74211868@shalomcontrol.com') ) {

			this.setup_notification_listeners2();

			const obtener_documentos_por_zona = await frappe.db.get_list('Informacion de Coolers', {
				'filters':[
					['agencia','=',"MEXICO"],
					['estado','=','Pendiente']
				],
				'limit':'None',
				fields: ['name','codigo_del_cooler','agencia','fecha_de_ultimo_escaneo']
			})

			if ( !obtener_documentos_por_zona.length ) {
				await this.render_events_html2([])
				$(".circleCooler").css({
					"background-color": "white",
					"color": "black",
				});
				document.getElementsByClassName('circleCooler')[0].textContent = 0
				return false
			}

			//await this.soundAndVoice()

			$(".circleCooler").css({
				"background-color": "#e24c4c",
			});

			let noti1 = document.getElementsByClassName('circleCooler')

			if ( noti1.length == 0 ) {
				$(`<div class="circleTask" style="background: white">${obtener_documentos_por_zona.length}</div>`).insertBefore("#todays_events");
			} else {
				let nueva_cantidad = parseInt( obtener_documentos_por_zona.length )
				noti1[0].textContent = nueva_cantidad
			}

			$(".circleCooler").css({
				"margin-top":"2px",
				"width": "20px",
				"height": "20px",
				"background-color": "#e24c4c",
				"border-radius": "50%", /* Hace que el div sea redondo */
				"display": "flex",
				"justify-content": "center",
				"align-items": "center",
				"color": "white",
				"font-size": "10px",
				"font-weight": "bold",
			});

			let idGeneral = document.getElementById('generalCount')
			let cantidad_material = parseInt( document.getElementsByClassName('circleMaterialRequest')[0].textContent )
			let cantidad_task = parseInt( document.getElementsByClassName('circleTask')[0].textContent )
			let cantidad_cooler = parseInt( document.getElementsByClassName('circleCooler')[0].textContent )
			let cantidad_film = parseInt( document.getElementsByClassName('circleMaterialFilm')[0].textContent )
			idGeneral.textContent = cantidad_material + cantidad_task + cantidad_cooler + cantidad_film
			if ( idGeneral.textContent > 0 ) {
				$(".circle").css({
					"background-color": "#e24c4c",
					"color": "white",
				});
			} else {
				idGeneral.textContent = 0
				$(".circle").css({
					"background-color": "#242a30",
					"color": "white",
				});
			}

			this.render_events_html2(obtener_documentos_por_zona);
		} else if ( frappe.user_roles.includes( 'Supervisor Nacional' ) ) {

			this.setup_notification_listeners2();

			const obtener_zona = await frappe.db.get_list('User Permission', {
				'filters':[
					['allow','=','Zonas Nacional'],
					['user','=',frappe.user.name],
				],
				'limit':'None',
				fields: ['for_value']
			})
			if ( !obtener_zona.length ) {
				await this.render_events_html2([])
				return false
			}
			const obtener_documentos_embarque = await frappe.db.get_list('Informacion de Coolers', {
				'filters':[
					['zona_nacional_responsable_desembarque','IN',obtener_zona[0].for_value],
					['estado','=','Pendiente'],
					['tipo','=','embarque']
				],
				'limit':'None',
				fields: ['name','codigo_del_cooler','agencia','fecha_de_ultimo_escaneo']
			})

			const obtener_documentos_desembarque = await frappe.db.get_list('Informacion de Coolers', {
				'filters':[
					['zona_nacional','IN',obtener_zona[0].for_value],
					['estado','=','Pendiente'],
					['tipo','=','desembarque']
				],
				'limit':'None',
				fields: ['name','codigo_del_cooler','agencia','fecha_de_ultimo_escaneo']
			})

			const documentos_combinados = obtener_documentos_embarque.concat(obtener_documentos_desembarque);


			if ( !documentos_combinados.length ) {
				await this.render_events_html2([])
				$(".circleCooler").css({
					"background-color": "white",
					"color": "black",
				});
				document.getElementsByClassName('circleCooler')[0].textContent = 0
				return false
			}

			let fecha_actual = moment().format("YYYY-MM-DD HH:mm:ss")
			let fecha_menos_cuatro = moment(fecha_actual).subtract(11, 'day').format("YYYY-MM-DD")

			let arrayCoolers = []

			for ( let cooler of documentos_combinados ) {
				if ( fecha_menos_cuatro > cooler.fecha_de_ultimo_escaneo ) {
					arrayCoolers.push(cooler)
				}
			}

			if ( !arrayCoolers.length ) {
				await this.render_events_html2([])
				return false
			}

			//await this.soundAndVoice()

			$(".circleCooler").css({
				"background-color": "#e24c4c",
			});

			let noti1 = document.getElementsByClassName('circleCooler')

			if ( noti1.length == 0 ) {
				$(`<div class="circleTask" style="background: white">${arrayCoolers.length}</div>`).insertBefore("#todays_events");
			} else {
				let nueva_cantidad = parseInt( arrayCoolers.length )
				noti1[0].textContent = nueva_cantidad
			}

			$(".circleCooler").css({
				"margin-top":"2px",
				"width": "20px",
				"height": "20px",
				"background-color": "#e24c4c",
				"border-radius": "50%", /* Hace que el div sea redondo */
				"display": "flex",
				"justify-content": "center",
				"align-items": "center",
				"color": "white",
				"font-size": "10px",
				"font-weight": "bold",
			});

			let idGeneral = document.getElementById('generalCount')
			let cantidad_material = parseInt( document.getElementsByClassName('circleMaterialRequest')[0].textContent )
			let cantidad_task = parseInt( document.getElementsByClassName('circleTask')[0].textContent )
			let cantidad_cooler = parseInt( document.getElementsByClassName('circleCooler')[0].textContent )
			let cantidad_film = parseInt( document.getElementsByClassName('circleMaterialFilm')[0].textContent )
			idGeneral.textContent = cantidad_material + cantidad_task + cantidad_cooler + cantidad_film
			if ( idGeneral.textContent > 0 ) {
				$(".circle").css({
					"background-color": "#e24c4c",
					"color": "white",
				});
			} else {
				idGeneral.textContent = 0
				$(".circle").css({
					"background-color": "#242a30",
					"color": "white",
				});
			}

			this.render_events_html2(arrayCoolers);

		} else if ( frappe.user_roles.includes('Administrador de agencia') ) {

			let getAgencyAdministrator = await $.ajax({
				type:"POST",
				url:'https://recursoshumanos.shalom.com.pe/module/notification/get-agency-administrator',
				dataType:"JSON",
				data: {
					"user": frappe.user.name
				}
			});

			if ( !getAgencyAdministrator.status ) {
				await this.render_events_html2([])
				return false
			}
			const obtener_documentos_embarque = await frappe.db.get_list('Informacion de Coolers', {
				'filters':[
					['agencia_responsable_desembarque','=',getAgencyAdministrator.branch],
					['estado','=','Pendiente'],
					['tipo','=','embarque']
				],
				'limit':'None',
				fields: ['name','codigo_del_cooler','agencia','fecha_de_ultimo_escaneo']
			})

			const obtener_documentos_desembarque = await frappe.db.get_list('Informacion de Coolers', {
				'filters':[
					['agencia','=',getAgencyAdministrator.branch],
					['estado','=','Pendiente'],
					['tipo','=','desembarque']
				],
				'limit':'None',
				fields: ['name','codigo_del_cooler','agencia','fecha_de_ultimo_escaneo']
			})

			const documentos_combinados_2 = obtener_documentos_embarque.concat(obtener_documentos_desembarque);

			if ( !documentos_combinados_2.length ) {
				await this.render_events_html2([])
				$(".circleCooler").css({
					"background-color": "white",
					"color": "black",
				});
				document.getElementsByClassName('circleCooler')[0].textContent = 0
				return false
			}

			//await this.soundAndVoice()

			$(".circleCooler").css({
				"background-color": "#e24c4c",
			});

			$(".circleCooler").css({
				"margin-top":"2px",
				"width": "20px",
				"height": "20px",
				"background-color": "#e24c4c",
				"border-radius": "50%", /* Hace que el div sea redondo */
				"display": "flex",
				"justify-content": "center",
				"align-items": "center",
				"color": "white",
				"font-size": "10px",
				"font-weight": "bold",
			});

			let noti1 = document.getElementsByClassName('circleCooler')

			if ( noti1.length == 0 ) {
				$(`<div class="circleTask" style="background: white">${documentos_combinados_2.length}</div>`).insertBefore("#todays_events");
			} else {
				let nueva_cantidad = parseInt( documentos_combinados_2.length )
				noti1[0].textContent = nueva_cantidad
			}



			let idGeneral = document.getElementById('generalCount')
			let cantidad_material = parseInt( document.getElementsByClassName('circleMaterialRequest')[0].textContent )
			let cantidad_task = parseInt( document.getElementsByClassName('circleTask')[0].textContent )
			let cantidad_cooler = parseInt( document.getElementsByClassName('circleCooler')[0].textContent )
			let cantidad_film = parseInt( document.getElementsByClassName('circleMaterialFilm')[0].textContent )
			idGeneral.textContent = cantidad_material + cantidad_task + cantidad_cooler + cantidad_film
			if ( idGeneral.textContent > 0 ) {
				$(".circle").css({
					"background-color": "#e24c4c",
					"color": "white",
				});
			} else {
				idGeneral.textContent = 0
				$(".circle").css({
					"background-color": "#242a30",
					"color": "white",
				});
			}
			//await this.soundAndVoice()
			this.render_events_html2(documentos_combinados_2);

		}

	}
	async render_events_html2(event_list) {

		let html = '';
		let count = 0
		if (event_list.length) {
			let get_event_html = (event) => {

				let user = event_list.from_user;
				let user_avatar = frappe.avatar(user, 'avatar-medium user-avatar');

				return `<a class="recent-item event" href="/app/informacion-de-coolers/${event.name}">
					<div class="event-border" style="border-color: red"></div>
					<div class="notification-body ml-3">
						${user_avatar}
					</div>
					<div class="event-item ml-1">
						<div class="event-subject" style="font-weight: bold; color: red">Fecha de Ultimo Escaneo: ${event.fecha_de_ultimo_escaneo}</div>
						<span style="font-weight: bold">El cooler ${event.codigo_del_cooler} se encuentra en la agencia ${event.agencia} debe indicar detalle de lo sucedido</span><br>
					</div>
				</a>`;
			};
			html = event_list.map(get_event_html).join('');
		} else {
			html = `
				<div class="notification-null-state">
					<div class="text-center">
					<img src="/assets/frappe/images/ui-states/event-empty-state.svg" alt="Generic Empty State" class="null-state">
					<div class="title">${__('No coolers sin rotar')}</div>
					<div class="subtitle">
						${__('.')}
				</div></div></div>
			`;

			let idGeneral = document.getElementById('generalCount')
			let cantidad_material = parseInt( document.getElementsByClassName('circleMaterialRequest')[0].textContent )
			let cantidad_task = parseInt( document.getElementsByClassName('circleTask')[0].textContent )
			let cantidad_cooler = parseInt( document.getElementsByClassName('circleCooler')[0].textContent )
			let cantidad_film = parseInt( document.getElementsByClassName('circleMaterialFilm')[0].textContent )
			idGeneral.textContent = cantidad_material + cantidad_task + cantidad_cooler + cantidad_film
			if ( idGeneral.textContent > 0 ) {
				$(".circle").css({
					"background-color": "#e24c4c",
					"color": "white",
				});
			} else {
				idGeneral.textContent = 0
				$(".circle").css({
					"background-color": "#242a30",
					"color": "white",
				});
			}
		}

		this.container.html(html);

	}
	setup_notification_listeners2() {
		frappe.realtime.on('notification', () => {
			this.make()
		});

	}
}

class EventsMaterialView extends BaseNotificationsView {
	async soundAndVoice() {
		const synth = window.speechSynthesis
		let voices = []
		voices = await synth.getVoices()

		let utterThis = new SpeechSynthesisUtterance("Tiene solicitudes de materiales pendientes de aprobar")
		utterThis.voice = voices[1]

		utterThis.pitch = 1
		utterThis.rate = 1
		utterThis.volume = 1
		utterThis.onstart = (e) => {
		}
		utterThis.onerror = (e) => {
		}
		synth.speak(utterThis)

		const audioContext = new (window.AudioContext || window.webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		oscillator.connect(audioContext.destination);
		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
		oscillator.start();
		oscillator.stop(audioContext.currentTime + 0.5);
	}
	async make() {
		let icon_material_film = document.getElementsByClassName('circleMaterialFilm')
		if (icon_material_film.length === 0) {
			$(`<div class="circleMaterialFilm">0</div>`).insertBefore("#solicitud_materiales_film");
			$(".circleMaterialFilm").css({
				"margin-top": "2px",
				"color":"black",
				"width": "20px",
				"height": "20px",
				"background-color": "white",
				"border-radius": "50%",
				"display": "flex",
				"justify-content": "center",
				"align-items": "center",
				"font-size": "10px",
				"font-weight": "bold",
			});
		}
		if (frappe.user.name !== '71021133@shalomcontrol.com') {
			await this.render_events_html2([])
			$(".circleMaterialFilm").css({
				"background-color": "white",
				"color": "black",
			});
			document.getElementsByClassName('circleMaterialFilm')[0].textContent = 0
			return false
		}
		const obtener_materiales_film = await frappe.db.get_list('Material Request', {
			'filters':[
				['docstatus','=',1],
				['aprobacion_de_solicitud','=','En Espera'],
				['material_film','=',1]
			],
			'limit':'None',
			fields: ['name','owner','aprobacion_de_solicitud']
		})
		if (!obtener_materiales_film.length) {
			await this.render_events_html2([])
			$(".circleMaterialFilm").css({
				"background-color": "white",
				"color": "black",
			});
			document.getElementsByClassName('circleMaterialFilm')[0].textContent = 0
			return false
		}
		let noti1 = document.getElementsByClassName('circleMaterialFilm')
		if ( noti1.length == 0 ) {
			$(`<div class="circleMaterialFilm" style="background: white">${obtener_materiales_film.length}</div>`).insertBefore("#solicitud_materiales_film");
		} else {
			let nueva_cantidad = parseInt( obtener_materiales_film.length )
			noti1[0].textContent = nueva_cantidad
		}
		$(".circleMaterialFilm").css({
			"background-color": "#e24c4c",
		});

		$(".circleMaterialFilm").css({
			"margin-top":"2px",
			"width": "20px",
			"height": "20px",
			"background-color": "#e24c4c",
			"border-radius": "50%", /* Hace que el div sea redondo */
			"display": "flex",
			"justify-content": "center",
			"align-items": "center",
			"color": "white",
			"font-size": "10px",
			"font-weight": "bold",
		});

		await this.soundAndVoice()

		let idGeneral = document.getElementById('generalCount')
		let cantidad_material = parseInt( document.getElementsByClassName('circleMaterialRequest')[0].textContent )
		let cantidad_task = parseInt( document.getElementsByClassName('circleTask')[0].textContent )
		let cantidad_cooler = parseInt( document.getElementsByClassName('circleCooler')[0].textContent )
		let cantidad_film = parseInt( document.getElementsByClassName('circleMaterialFilm')[0].textContent )
		idGeneral.textContent = cantidad_material + cantidad_task + cantidad_cooler + cantidad_film
		if ( idGeneral.textContent > 0 ) {
			$(".circle").css({
				"background-color": "#e24c4c",
				"color": "white",
			});
		} else {
			idGeneral.textContent = 0
			$(".circle").css({
				"background-color": "#242a30",
				"color": "white",
			});
		}
		await this.render_events_html2(obtener_materiales_film)
	}
	async render_events_html2(event_list) {
		let html = '';
		let count = 0
		if (event_list.length) {
			let get_event_html = (event) => {

				let user = event_list.from_user;
				let user_avatar = frappe.avatar(user, 'avatar-medium user-avatar');

				return `<a class="recent-item event" href="/app/material-request/${event.name}">
					<div class="event-border" style="border-color: red"></div>
					<div class="notification-body ml-3">
						${user_avatar}
					</div>
					<div class="event-item ml-1">
						<div class="event-subject" style="font-weight: bold; color: red">Tiene unan solicitud de material pendiente de aprobar</div>
						<span style="font-weight: bold">Presione para ir a la solicitud</span><br>
					</div>
				</a>`;
			};
			html = event_list.map(get_event_html).join('');
		} else {
			html = `
				<div class="notification-null-state">
					<div class="text-center">
					<img src="/assets/frappe/images/ui-states/event-empty-state.svg" alt="Generic Empty State" class="null-state">
					<div class="title">${__('No tiene acceso a este apartado')}</div>
					<div class="subtitle">
						${__('.')}
				</div></div></div>
			`;

			let idGeneral = document.getElementById('generalCount')
			let cantidad_material = parseInt( document.getElementsByClassName('circleMaterialRequest')[0].textContent )
			let cantidad_task = parseInt( document.getElementsByClassName('circleTask')[0].textContent )
			let cantidad_cooler = parseInt( document.getElementsByClassName('circleCooler')[0].textContent )
			let cantidad_film = parseInt( document.getElementsByClassName('circleMaterialFilm')[0].textContent )
			idGeneral.textContent = cantidad_material + cantidad_task + cantidad_cooler + cantidad_film
			if ( idGeneral.textContent > 0 ) {
				$(".circle").css({
					"background-color": "#e24c4c",
					"color": "white",
				});
			} else {
				idGeneral.textContent = 0
				$(".circle").css({
					"background-color": "#242a30",
					"color": "white",
				});
			}
		}

		this.container.html(html);

	}
	setup_notification_listeners2() {
		frappe.realtime.on('notification', () => {
			this.make()
		});

	}
}

class EventsValidationView extends BaseNotificationsView {
	async soundAndVoice() {
		const synth = window.speechSynthesis
		let voices = []
		voices = await synth.getVoices()

		let utterThis = new SpeechSynthesisUtterance("Hay empleados sin contrato, abre tus notificaciones")
		utterThis.voice = voices[1]

		utterThis.pitch = 1
		utterThis.rate = 1
		utterThis.volume = 1
		utterThis.onstart = (e) => {
		}
		utterThis.onerror = (e) => {
		}
		synth.speak(utterThis)

		const audioContext = new (window.AudioContext || window.webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		oscillator.connect(audioContext.destination);
		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
		oscillator.start();
		oscillator.stop(audioContext.currentTime + 0.5);
	}
	async soundAndVoice2() {
		const synth = window.speechSynthesis
		let voices = []
		voices = await synth.getVoices()

		let utterThis = new SpeechSynthesisUtterance("Hay solicitudes de pago duplicadas, abre tus notificaciones")
		utterThis.voice = voices[1]

		utterThis.pitch = 1
		utterThis.rate = 1
		utterThis.volume = 1
		utterThis.onstart = (e) => {
		}
		utterThis.onerror = (e) => {
		}
		synth.speak(utterThis)

		const audioContext = new (window.AudioContext || window.webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		oscillator.connect(audioContext.destination);
		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
		oscillator.start();
		oscillator.stop(audioContext.currentTime + 0.5);
	}
	async soundAndVoice3() {
		const synth = window.speechSynthesis
		let voices = []
		voices = await synth.getVoices()

		let utterThis = new SpeechSynthesisUtterance("Hola Leonardo, He encontrado altas medicas duplicadas, abre tus notificaciones")
		utterThis.voice = voices[1]

		utterThis.pitch = 1
		utterThis.rate = 1
		utterThis.volume = 1
		utterThis.onstart = (e) => {
		}
		utterThis.onerror = (e) => {
		}
		synth.speak(utterThis)

		const audioContext = new (window.AudioContext || window.webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		oscillator.connect(audioContext.destination);
		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
		oscillator.start();
		oscillator.stop(audioContext.currentTime + 0.5);
	}
	async make() {
		let icon_validation_film = document.getElementsByClassName('circle-validation-film')
		if (icon_validation_film.length === 0) {
			$(`<div class="circle-validation-film">0</div>`).insertBefore("#validate_form_gym");
			$(".circle-validation-film").css({
				"margin-top": "2px",
				"color":"white",
				"width": "20px",
				"height": "20px",
				"background-color": "rgb(81, 114, 206)",
				"border-radius": "50%",
				"display": "flex",
				"justify-content": "center",
				"align-items": "center",
				"font-size": "12px",
				"font-weight": "bold",
			});
		}
		this.setup_notification_listeners2()
		if (frappe.datetime.get_datetime_as_string().split(" ")[1] >= '09:59:00' && frappe.datetime.get_datetime_as_string().split(" ")[1] <= '23:59:59') {
			let get_employees_without_contract = await $.ajax({
				type:"GET",
				url:'https://horario-salida-qa-erpwin.shalom.com.pe/validation-discord/workers-without-contract',
				dataType:"JSON"
			});
			let get_payment_duplicate = await $.ajax({
				type:"GET",
				url:'https://horario-salida-qa-erpwin.shalom.com.pe/validation-discord/duplicate-payment',
				dataType:"JSON"
			});
			let get_medical_duplicate = await $.ajax({
				type:"GET",
				url:'https://horario-salida-qa-erpwin.shalom.com.pe/validation-discord/medical-discharge-validation',
				dataType:"JSON"
			});
			let response_services_validation = []
			if (!get_employees_without_contract.status && !get_payment_duplicate.status && !get_medical_duplicate.status) {
				await this.render_events_html2([])
			}
			response_services_validation.push(get_payment_duplicate)
			response_services_validation.push(get_employees_without_contract)
			response_services_validation.push(get_medical_duplicate)
			$(".circle-validation-film").css({
				"background-color": "rgb(81, 114, 206)",
				"color": "white"
			});
			icon_validation_film[0].textContent = response_services_validation.length
			let idGeneral = document.getElementById('generalCount')
			let cantidad_material = document.getElementsByClassName('circleMaterialRequest').length > 0 ? parseInt( document.getElementsByClassName('circleMaterialRequest')[0].textContent ) : 0
			let cantidad_task = document.getElementsByClassName('circleTask').length > 0 ? parseInt( document.getElementsByClassName('circleTask')[0].textContent ) : 0
			let cantidad_cooler = document.getElementsByClassName('circleCooler').length > 0 ? parseInt( document.getElementsByClassName('circleCooler')[0].textContent ) : 0
			let cantidad_film = document.getElementsByClassName('circleMaterialFilm').length > 0 ? parseInt( document.getElementsByClassName('circleMaterialFilm')[0].textContent ) : 0
			let cantidad_validation = document.getElementsByClassName('circle-validation-film').length > 0 ? parseInt( document.getElementsByClassName('circle-validation-film')[0].textContent ) : 0
			idGeneral.textContent = cantidad_material + cantidad_task + cantidad_cooler + cantidad_film + cantidad_validation
			if ( idGeneral.textContent > 0 ) {
				$(".circle").css({
					"background-color": "#e24c4c",
					"color": "white",
				});
			} else {
				idGeneral.textContent = 0
				$(".circle").css({
					"background": "rgb(81, 114, 206)",
					"color": "white",
				});
			}
			if (frappe.datetime.get_datetime_as_string().split(" ")[1] >= '09:59:00' && frappe.datetime.get_datetime_as_string().split(" ")[1] <= '10:01:59' ||
				frappe.datetime.get_datetime_as_string().split(" ")[1] >= '16:59:00' && frappe.datetime.get_datetime_as_string().split(" ")[1] <= '17:01:59') {
				if (get_employees_without_contract.status) {
					 await this.soundAndVoice()
				}
			}
			if (frappe.datetime.get_datetime_as_string().split(" ")[1] >= '08:59:00' && frappe.datetime.get_datetime_as_string().split(" ")[1] <= '09:01:59' ||
				frappe.datetime.get_datetime_as_string().split(" ")[1] >= '15:59:00' && frappe.datetime.get_datetime_as_string().split(" ")[1] <= '16:01:59') {
				if (get_payment_duplicate.status) {
					await this.soundAndVoice2()
				}
			}
			if (get_medical_duplicate.status) {
				await this.soundAndVoice3()
			}
			await this.render_events_html2(response_services_validation)
			if (document.getElementById('Finance')) {
				let button_event_finance = document.getElementById('Finance')
				button_event_finance.addEventListener("click", function() {
					let table_finance = `
						<div class="row form-section card-section visible-section" style="padding-left: 25px;padding-right: 25px">
							<div class="section-body">
								<div class="form-column col-sm-3">
									<form>
										<div class="frappe-control input-max-width" data-fieldtype="Select" data-fieldname="año" title="año">
											<div class="form-group">
												<div class="clearfix">
													<label class="control-label" style="padding-right: 0px;">Area</label>
												</div>
												<div class="control-input-wrapper">
													<div class="control-input" style="display: none;"></div>
													<div class="control-value like-disabled-input" style="">Finanzas</div>
													<p class="help-box small text-muted"></p>
												</div>
											</div>
										</div>
									</form>
								</div>
								<div class="form-column col-sm-3">
									<form>
										<div class="frappe-control input-max-width" data-fieldtype="Select" data-fieldname="año" title="año">
											<div class="form-group">
    <div class="clearfix">
        <label class="control-label" style="padding-right: 0px;">Frecuencia</label>
    </div>
    <div class="control-input-wrapper">
        <div class="control-input" style="display: none;"></div>
        <div class="control-value like-disabled-input" style="">2 veces al dia</div>
        <p class="help-box small text-muted"></p>
    </div>
</div>
										</div>
									</form>
								</div>
								<div class="form-column col-sm-3">
									<form>
										<div class="frappe-control input-max-width" data-fieldtype="Select" data-fieldname="año" title="año">
											<div class="form-group">
    <div class="clearfix">
        <label class="control-label" style="padding-right: 0px;">Hora</label>
    </div>
    <div class="control-input-wrapper">
        <div class="control-input" style="display: none;"></div>
        <div class="control-value like-disabled-input" style="">9 AM - 4 PM</div>
        <p class="help-box small text-muted"></p>
    </div>
</div>
										</div>
									</form>
								</div>
								<div class="form-column col-sm-3">
									<form>
										<div class="frappe-control input-max-width" data-fieldtype="Select" data-fieldname="año" title="año">
											<div class="form-group">
												<div class="clearfix">
													<label class="control-label" style="padding-right: 0px;">Cantidad</label>
												</div>
												<div class="control-input-wrapper">
													<div class="control-input" style="display: none;"></div>
													<div class="control-value like-disabled-input" style="">${get_payment_duplicate.data.length}</div>
													<p class="help-box small text-muted"></p>
												</div>
											</div>
										</div>
									</form>
								</div>
							</div>
						</div>
						<div class="mt-4 mb-4 frappe-control form-group mx-4" data-fieldtype="Table" data-fieldname="table_licencias" title="table_licencias">
							<div class="form-grid">
								  <div class="grid-heading-row">
									<div class="grid-row">
									  <div class="data-row row">
										<div class="head col grid-static-col col-xs-3 mt-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">RUC</div>
										</div>
										<div class="head col grid-static-col col-xs-3 mt-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Nº FACTURA</div>
										</div>
										<div class="head col grid-static-col col-xs-2 mt-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Nº SERIE</div>
										</div>
										<div class="head col grid-static-col col-xs-2 mt-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">MONTO</div>
										</div>
										<div class="head col grid-static-col col-xs-2 mt-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">REPETIDOS</div>
										</div>
									  </div>
									</div>
									<div class="grid-body">
										<div class="rows">
											<div class="spinner-border text-primary" role="status" id="loading_spinner_finance" style="margin-left: 240px;margin-top: 10px; margin-bottom: 5px">
											  <span class="visually-hidden"></span>
											</div>
											<div id="table_data_finance" style="display: none">
											</div>
											<div id="table_finance" class="grid-empty text-center" style="display: none">
												<img src="https://capacitacion.shalom.com.pe/assets/frappe/images/ui-states/grid-empty-state.svg" alt="Grid Empty State" class="grid-empty-illustration">
												No hay datos
											</div>
										</div>
									  </div>
								  </div>
							</div>
						  </div>`
					frappe.msgprint({
						title: __('Solicitud de Pago Duplicados'),
						message: table_finance
					});
					let tamano_modal = document.getElementsByClassName('modal-content')
					let taman_modal_general = document.getElementsByClassName('modal-dialog')
					setTimeout( async ()=>{
						tamano_modal[0].style.width = "900px"
						taman_modal_general[0].style.maxWidth = "800px"
						$('.head').css({'height': '40px'});
						$('#loading_spinner_finance').css('margin-left', '340px');
						let table_data_finance = document.getElementById('table_data_finance')

						for (let item of get_payment_duplicate.data) {
							let parent_row = document.createElement('div')
							parent_row.classList.add('grid-row')

							let div_parent = document.createElement('div')
							div_parent.classList.add('data-row', 'row')

							let div_children_one = document.createElement('div')
							div_children_one.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-3','head2');
							let span_one = document.createElement('span')
							span_one.classList.add('text-center', 'font-weight-bold', 'mt-1');
							span_one.innerHTML = item.ruc
							span_one.style.display = 'block'

							let div_children_two = document.createElement('div')
							div_children_two.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-3','head2');
							let span_two = document.createElement('span')
							span_two.classList.add('text-center', 'font-weight-bold', 'mt-1');
							span_two.innerHTML = item.number_factura
							span_two.style.display = 'block'

							let div_children_three = document.createElement('div')
							div_children_three.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-2','head2');
							let span_three = document.createElement('span')
							span_three.classList.add('text-center', 'font-weight-bold', 'mt-1');
							span_three.innerHTML = item.n_serie
							span_three.style.display = 'block'

							let div_children_four = document.createElement('div')
							div_children_four.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-2','head2');
							let span_four = document.createElement('span')
							span_four.classList.add('text-center', 'font-weight-bold', 'mt-1');
							span_four.innerHTML = item.monto
							span_four.style.display = 'block'

							let div_children_five = document.createElement('div')
							div_children_five.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-2','head2');
							let span_five = document.createElement('span')
							span_five.classList.add('text-center', 'font-weight-bold', 'mt-1');
							span_five.innerHTML = item.cantidad
							span_five.style.display = 'block'

							div_children_one.appendChild(span_one)
							div_children_two.appendChild(span_two)
							div_children_three.appendChild(span_three)
							div_children_four.appendChild(span_four)
							div_children_five.appendChild(span_five)

							div_parent.appendChild(div_children_one)
							div_parent.appendChild(div_children_two)
							div_parent.appendChild(div_children_three)
							div_parent.appendChild(div_children_four)
							div_parent.appendChild(div_children_five)

							parent_row.appendChild(div_parent)
							table_data_finance.appendChild(parent_row)
						}
						$('#loading_spinner_finance').hide();
						$('#table_data_finance').show();
					},1000)
				});
			}
			if (document.getElementById('Human-Resource')) {
				let button_event_human = document.getElementById('Human-Resource')
				button_event_human.addEventListener("click", function() {
					let table_human = `
						<div class="row form-section card-section visible-section" style="padding-left: 25px;padding-right: 25px">
							<div class="section-body">
								<div class="form-column col-sm-3">
									<form>
										<div class="frappe-control input-max-width" data-fieldtype="Select" data-fieldname="año" title="año">
											<div class="form-group">
												<div class="clearfix">
													<label class="control-label" style="padding-right: 0px;">Area</label>
												</div>
												<div class="control-input-wrapper">
													<div class="control-input" style="display: none;"></div>
													<div class="control-value like-disabled-input" style="">Recursos Humanos</div>
													<p class="help-box small text-muted"></p>
												</div>
											</div>
										</div>
									</form>
								</div>
								<div class="form-column col-sm-3">
									<form>
										<div class="frappe-control input-max-width" data-fieldtype="Select" data-fieldname="año" title="año">
											<div class="form-group">
						<div class="clearfix">
						<label class="control-label" style="padding-right: 0px;">Frecuencia</label>
						</div>
						<div class="control-input-wrapper">
						<div class="control-input" style="display: none;"></div>
						<div class="control-value like-disabled-input" style="">2 veces al dia</div>
						<p class="help-box small text-muted"></p>
						</div>
						</div>
										</div>
									</form>
								</div>
								<div class="form-column col-sm-3">
									<form>
										<div class="frappe-control input-max-width" data-fieldtype="Select" data-fieldname="año" title="año">
											<div class="form-group">
						<div class="clearfix">
						<label class="control-label" style="padding-right: 0px;">Hora</label>
						</div>
						<div class="control-input-wrapper">
						<div class="control-input" style="display: none;"></div>
						<div class="control-value like-disabled-input" style="">10 AM - 5 PM</div>
						<p class="help-box small text-muted"></p>
						</div>
						</div>
										</div>
									</form>
								</div>
								<div class="form-column col-sm-3">
									<form>
										<div class="frappe-control input-max-width" data-fieldtype="Select" data-fieldname="año" title="año">
											<div class="form-group">
												<div class="clearfix">
													<label class="control-label" style="padding-right: 0px;">Cantidad</label>
												</div>
												<div class="control-input-wrapper">
													<div class="control-input" style="display: none;"></div>
													<div class="control-value like-disabled-input" style="">${get_employees_without_contract.data.length}</div>
													<p class="help-box small text-muted"></p>
												</div>
											</div>
										</div>
									</form>
								</div>
							</div>
						</div>
						<div class="mt-4 mb-4 frappe-control form-group mx-4" data-fieldtype="Table" data-fieldname="table_licencias" title="table_licencias">
							<div class="form-grid">
								  <div class="grid-heading-row">
									<div class="grid-row">
									  <div class="data-row row">
										<div class="head col grid-static-col col-xs-3 mt-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">ID EMPLEADO</div>
										</div>
										<div class="head col grid-static-col col-xs-3 mt-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">NOMBRE COMPLETO</div>
										</div>
										<div class="head col grid-static-col col-xs-3 mt-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">SUCURSAL</div>
										</div>
										<div class="head col grid-static-col col-xs-3 mt-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">FECHA DE INGRESO REAL</div>
										</div>
									  </div>
									</div>
									<div class="grid-body">
										<div class="rows">
											<div class="spinner-border text-primary" role="status" id="loading_spinner_human" style="margin-left: 240px;margin-top: 10px; margin-bottom: 5px">
											  <span class="visually-hidden"></span>
											</div>
											<div id="table_data_human" style="display: none">
											</div>
											<div id="table_human" class="grid-empty text-center" style="display: none">
												<img src="https://capacitacion.shalom.com.pe/assets/frappe/images/ui-states/grid-empty-state.svg" alt="Grid Empty State" class="grid-empty-illustration">
												No hay datos
											</div>
										</div>
									  </div>
								  </div>
							</div>
						  </div>`
					frappe.msgprint({
						title: __('Empleados sin Contrato'),
						message: table_human
					});
					let tamano_modal = document.getElementsByClassName('modal-content')
					let taman_modal_general = document.getElementsByClassName('modal-dialog')
					setTimeout( async ()=>{
						tamano_modal[0].style.width = "900px"
						taman_modal_general[0].style.maxWidth = "800px"
						$('.head').css({'height': '40px'});
						$('#loading_spinner_human').css('margin-left', '340px');
						let table_data_human = document.getElementById('table_data_human')

						for (let item of get_employees_without_contract.data) {
							let parent_row = document.createElement('div')
							parent_row.classList.add('grid-row')

							let div_parent = document.createElement('div')
							div_parent.classList.add('data-row', 'row')

							let div_children_one = document.createElement('div')
							div_children_one.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-3','head2');
							let span_one = document.createElement('span')
							span_one.classList.add('text-center', 'font-weight-bold','mt-2');
							span_one.innerHTML = item.name
							span_one.style.display = 'block'

							let div_children_two = document.createElement('div')
							div_children_two.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-3','head2');
							let span_two = document.createElement('span')
							span_two.classList.add('text-center', 'font-weight-bold',);
							span_two.innerHTML = item.nombre_completo
							span_two.style.display = 'block'

							let div_children_three = document.createElement('div')
							div_children_three.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-3','head2');
							let span_three = document.createElement('span')
							span_three.classList.add('text-center', 'font-weight-bold','mt-2');
							span_three.innerHTML = item.branch
							span_three.style.display = 'block'

							let div_children_four = document.createElement('div')
							div_children_four.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-3','head2');
							let span_four = document.createElement('span')
							span_four.classList.add('text-center', 'font-weight-bold','mt-2');
							span_four.innerHTML = item.fecha_de_ingreso_real
							span_four.style.display = 'block'

							div_children_one.appendChild(span_one)
							div_children_two.appendChild(span_two)
							div_children_three.appendChild(span_three)
							div_children_four.appendChild(span_four)

							div_parent.appendChild(div_children_one)
							div_parent.appendChild(div_children_two)
							div_parent.appendChild(div_children_three)
							div_parent.appendChild(div_children_four)

							parent_row.appendChild(div_parent)
							table_data_human.appendChild(parent_row)
						}
						$('.head2').css({'height': '55px'});
						$('#loading_spinner_human').hide();
						$('#table_data_human').show();
					},1000)
				});
			}
			if (document.getElementById('Human-Resource-2')) {
				let button_event_human_2 = document.getElementById('Human-Resource-2')
				button_event_human_2.addEventListener("click", function() {
					let table_human_2 = `
						<div class="row form-section card-section visible-section" style="padding-left: 25px;padding-right: 25px">
							<div class="section-body">
								<div class="form-column col-sm-3">
									<form>
										<div class="frappe-control input-max-width" data-fieldtype="Select" data-fieldname="año" title="año">
											<div class="form-group">
												<div class="clearfix">
													<label class="control-label" style="padding-right: 0px;">Area</label>
												</div>
												<div class="control-input-wrapper">
													<div class="control-input" style="display: none;"></div>
													<div class="control-value like-disabled-input" style="">Recursos Humanos</div>
													<p class="help-box small text-muted"></p>
												</div>
											</div>
										</div>
									</form>
								</div>
								<div class="form-column col-sm-3">
									<form>
										<div class="frappe-control input-max-width" data-fieldtype="Select" data-fieldname="año" title="año">
											<div class="form-group">
						<div class="clearfix">
						<label class="control-label" style="padding-right: 0px;">Frecuencia</label>
						</div>
						<div class="control-input-wrapper">
						<div class="control-input" style="display: none;"></div>
						<div class="control-value like-disabled-input" style="">2 veces al dia</div>
						<p class="help-box small text-muted"></p>
						</div>
						</div>
										</div>
									</form>
								</div>
								<div class="form-column col-sm-3">
									<form>
										<div class="frappe-control input-max-width" data-fieldtype="Select" data-fieldname="año" title="año">
											<div class="form-group">
						<div class="clearfix">
						<label class="control-label" style="padding-right: 0px;">Hora</label>
						</div>
						<div class="control-input-wrapper">
						<div class="control-input" style="display: none;"></div>
						<div class="control-value like-disabled-input" style="">10 AM - 5 PM</div>
						<p class="help-box small text-muted"></p>
						</div>
						</div>
										</div>
									</form>
								</div>
								<div class="form-column col-sm-3">
									<form>
										<div class="frappe-control input-max-width" data-fieldtype="Select" data-fieldname="año" title="año">
											<div class="form-group">
												<div class="clearfix">
													<label class="control-label" style="padding-right: 0px;">Cantidad</label>
												</div>
												<div class="control-input-wrapper">
													<div class="control-input" style="display: none;"></div>
													<div class="control-value like-disabled-input" style="">${get_medical_duplicate.data.length}</div>
													<p class="help-box small text-muted"></p>
												</div>
											</div>
										</div>
									</form>
								</div>
							</div>
						</div>
						<div class="mt-4 mb-4 frappe-control form-group mx-4" data-fieldtype="Table" data-fieldname="table_licencias" title="table_licencias">
							<div class="form-grid">
								  <div class="grid-heading-row">
									<div class="grid-row">
									  <div class="data-row row">
										<div class="head col grid-static-col col-xs-3 mt-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">ID EMPLEADO</div>
										</div>
										<div class="head col grid-static-col col-xs-3 mt-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">NOMBRE COMPLETO</div>
										</div>
										<div class="head col grid-static-col col-xs-3 mt-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">FECHA DE INGRESO</div>
										</div>
										<div class="head col grid-static-col col-xs-3 mt-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">MES</div>
										</div>
									  </div>
									</div>
									<div class="grid-body">
										<div class="rows">
											<div class="spinner-border text-primary" role="status" id="loading_spinner_human_2" style="margin-left: 240px;margin-top: 10px; margin-bottom: 5px">
											  <span class="visually-hidden"></span>
											</div>
											<div id="table_data_human_2" style="display: none">
											</div>
											<div id="table_human" class="grid-empty text-center" style="display: none">
												<img src="https://capacitacion.shalom.com.pe/assets/frappe/images/ui-states/grid-empty-state.svg" alt="Grid Empty State" class="grid-empty-illustration">
												No hay datos
											</div>
										</div>
									  </div>
								  </div>
							</div>
						  </div>`
					frappe.msgprint({
						title: __('Alta Medicas duplicadas'),
						message: table_human_2
					});
					let tamano_modal = document.getElementsByClassName('modal-content')
					let taman_modal_general = document.getElementsByClassName('modal-dialog')
					setTimeout( async ()=>{
						tamano_modal[0].style.width = "900px"
						taman_modal_general[0].style.maxWidth = "800px"
						$('.head').css({'height': '40px'});
						$('#loading_spinner_human_2').css('margin-left', '340px');
						let table_data_human = document.getElementById('table_data_human_2')

						for (let item of get_medical_duplicate.data) {
							console.log(item,'item')
							let parent_row = document.createElement('div')
							parent_row.classList.add('grid-row')

							let div_parent = document.createElement('div')
							div_parent.classList.add('data-row', 'row')

							let div_children_one = document.createElement('div')
							div_children_one.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-3','head2');
							let span_one = document.createElement('span')
							span_one.classList.add('text-center', 'font-weight-bold','mt-2');
							span_one.innerHTML = item.empleado
							span_one.style.display = 'block'

							let div_children_two = document.createElement('div')
							div_children_two.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-3','head2');
							let span_two = document.createElement('span')
							span_two.classList.add('text-center', 'font-weight-bold',);
							span_two.innerHTML = item.nombre_completo
							span_two.style.display = 'block'

							let div_children_three = document.createElement('div')
							div_children_three.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-3','head2');
							let span_three = document.createElement('span')
							span_three.classList.add('text-center', 'font-weight-bold','mt-2');
							span_three.innerHTML = item.fecha_de_ingreso
							span_three.style.display = 'block'

							let div_children_four = document.createElement('div')
							div_children_four.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-3','head2');
							let span_four = document.createElement('span')
							span_four.classList.add('text-center', 'font-weight-bold','mt-2');
							span_four.innerHTML = item.filtro_mes
							span_four.style.display = 'block'

							div_children_one.appendChild(span_one)
							div_children_two.appendChild(span_two)
							div_children_three.appendChild(span_three)
							div_children_four.appendChild(span_four)

							div_parent.appendChild(div_children_one)
							div_parent.appendChild(div_children_two)
							div_parent.appendChild(div_children_three)
							div_parent.appendChild(div_children_four)

							parent_row.appendChild(div_parent)
							table_data_human.appendChild(parent_row)
						}
						$('.head2').css({'height': '55px'});
						$('#loading_spinner_human_2').hide();
						$('#table_data_human_2').show();
					},1000)
				});
			}
			return false
		}
		let idGeneral = document.getElementById('generalCount')
		let cantidad_material = document.getElementsByClassName('circleMaterialRequest').length > 0 ? parseInt( document.getElementsByClassName('circleMaterialRequest')[0].textContent ) : 0
		let cantidad_task = document.getElementsByClassName('circleTask').length > 0 ? parseInt( document.getElementsByClassName('circleTask')[0].textContent ) : 0
		let cantidad_cooler = document.getElementsByClassName('circleCooler').length > 0 ? parseInt( document.getElementsByClassName('circleCooler')[0].textContent ) : 0
		let cantidad_film = document.getElementsByClassName('circleMaterialFilm').length > 0 ? parseInt( document.getElementsByClassName('circleMaterialFilm')[0].textContent ) : 0
		let cantidad_validation = document.getElementsByClassName('circle-validation-film').length > 0 ? parseInt( document.getElementsByClassName('circle-validation-film')[0].textContent ) : 0
		idGeneral.textContent = cantidad_material + cantidad_task + cantidad_cooler + cantidad_film + cantidad_validation
		if ( idGeneral.textContent > 0 ) {
			$(".circle").css({
				"background-color": "#e24c4c",
				"color": "white",
			});
		} else {
			idGeneral.textContent = 0
			$(".circle").css({
				"background": "rgb(81, 114, 206)",
				"color": "white",
			});
		}
		await this.render_events_html2([])
		return false
	}
	async render_events_html2(event_list) {
		let html = '';
		let count = 0
		if (event_list.length) {
			let get_event_html = (event) => {

				let user = event_list.from_user;
				let user_avatar = frappe.avatar(user, 'avatar-medium user-avatar');
				return `<div class="recent-item event" id="${event.area}">
					<div class="event-border" style="border-color: #474feb"></div>
					<div class="notification-body ml-3 mr-1">
						${user_avatar}
					</div>
					<div class="event-item ml-1">
						<div class="event-subject" style="font-weight: bold; ">${event.message}</div>
						<span class="subtitle" style="font-weight: 500">Área: ${event.area}</span><br>
						<span class="subtitle" style="font-weight: 500">Cantidad: ${event.count}</span><br>
						<span class="subtitle" style="font-weight: 500">Días reportando: ${event.consecutive_days}</span>
					</div>
				</div>`;
			};
			html = event_list.map(get_event_html).join('');
		} else {

			html = `
				<div class="notification-null-state">
					<div class="text-center">
					<img src="/assets/frappe/images/ui-states/event-empty-state.svg" alt="Generic Empty State" class="null-state">
					<div class="title">${__('Notificacion Inactiva')}</div>
					<div class="subtitle">
						${__('La notificacion se activa a las 10:00 am y a las 5:00 pm')}
				</div></div></div>
			`;
		}
		this.container.html(html);
	}
	setup_notification_listeners2() {
		frappe.realtime.on('notification', () => {
			this.make()
		});

	}
}
