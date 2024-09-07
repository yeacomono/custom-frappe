const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

frappe.standard_pages['Workspaces'] = function () {
    var wrapper = frappe.container.add_page('Workspaces');

    frappe.ui.make_app_page({
        parent: wrapper,
        name: 'Workspaces',
        title: __("Workspace"),
    });

    frappe.workspace = new frappe.views.Workspace(wrapper);
    $(wrapper).bind('show', function () {
        frappe.workspace.show();
    });
};

frappe.views.Workspace = class Workspace {
    constructor(wrapper) {
        this.wrapper = $(wrapper);
        this.page = wrapper.page;
        this.prepare_container();
        this.show_or_hide_sidebar();
        this.setup_dropdown();
        this.pages = {};
        this.sidebar_items = {};
        this.sidebar_categories = [
            "Modules",
            "Domains",
            "Places",
            "Administration"
        ];

        this.setup_workspaces();
        this.make_sidebar();
    }

    setup_workspaces() {
        // workspaces grouped by categories
        this.workspaces = {};
        for (let page of frappe.boot.allowed_workspaces) {
            if (!this.workspaces[page.category]) {
                this.workspaces[page.category] = [];
            }
            this.workspaces[page.category].push(page);
        }
    }

    show() {
        let page = this.get_page_to_show();
        this.page.set_title(`${__(page)}`);
        this.show_page(page);
    }

    prepare_container() {
        let list_sidebar = $(`
			<div class="list-sidebar overlay-sidebar hidden-xs hidden-sm">
				<div class="desk-sidebar list-unstyled sidebar-menu"></div>
			</div>
		`).appendTo(this.wrapper.find(".layout-side-section"));
        this.sidebar = list_sidebar.find(".desk-sidebar");

        this.body = this.wrapper.find(".layout-main-section");
    }

    get_page_to_show() {
        let default_page;

        if (localStorage.current_workspace) {
            default_page = localStorage.current_workspace;
        } else if (this.workspaces) {
            default_page = this.workspaces["Modules"][0].name;
        } else if (frappe.boot.allowed_workspaces) {
            default_page = frappe.boot.allowed_workspaces[0].name;
        } else {
            default_page = "Build";
        }

        let page = frappe.get_route()[1] || default_page;
        return page;
    }

    make_sidebar() {
        this.sidebar_categories.forEach(category => {
            if (this.workspaces[category]) {
                this.build_sidebar_section(category, this.workspaces[category]);
            }
        });
    }

    build_sidebar_section(title, items) {
        let sidebar_section = $(`<div class="standard-sidebar-section"></div>`);

        // DO NOT REMOVE: Comment to load translation
        // __("Modules") __("Domains") __("Places") __("Administration")
        $(`<div class="standard-sidebar-label">${__(title)}</div>`)
            .appendTo(sidebar_section);

        const get_sidebar_item = function (item) {
            return $(`
				<a
					href="/app/${frappe.router.slug(item.name)}"
					class="desk-sidebar-item standard-sidebar-item ${item.selected ? "selected" : ""}"
				>
					<span>${frappe.utils.icon(item.icon || "folder-normal", "md")}</span>
					<span class="sidebar-item-label">${item.label || item.name}<span>
				</a>
			`);
        };

        const make_sidebar_category_item = item => {
            if (item.name == this.get_page_to_show()) {
                item.selected = true;
                this.current_page_name = item.name;
            }

            let $item = get_sidebar_item(item);

            $item.appendTo(sidebar_section);
            this.sidebar_items[item.name] = $item;
        };

        items.forEach(item => make_sidebar_category_item(item));

        sidebar_section.appendTo(this.sidebar);
    }

    show_page(page) {
        if (this.current_page_name && this.pages[this.current_page_name]) {
            this.pages[this.current_page_name].hide();
        }

        if (this.sidebar_items && this.sidebar_items[this.current_page_name]) {
            this.sidebar_items[this.current_page_name].removeClass("selected");
            this.sidebar_items[page].addClass("selected");
        }
        this.current_page_name = page;
        localStorage.current_workspace = page;

        this.pages[page] ? this.pages[page].show() : this.make_page(page);
        this.current_page = this.pages[page];
        this.setup_dropdown();
    }

    make_page(page) {
        const $page = new DesktopPage({
            container: this.body,
            page_name: page
        });

        this.pages[page] = $page;
        return $page;
    }

    customize() {
        if (this.current_page && this.current_page.allow_customization) {
            this.page.clear_menu();
            this.current_page.customize();

            this.page.set_primary_action(
                __("Save Customizations"),
                () => {
                    this.current_page.save_customization();
                    this.page.clear_primary_action();
                    this.page.clear_secondary_action();
                    this.setup_dropdown();
                },
                null,
                __("Saving")
            );

            this.page.set_secondary_action(
                __("Discard"),
                () => {
                    this.current_page.reload();
                    frappe.show_alert({message: __("Customizations Discarded"), indicator: "info"});
                    this.page.clear_primary_action();
                    this.page.clear_secondary_action();
                    this.setup_dropdown();
                }
            );
        }
    }

    setup_dropdown() {
        this.page.clear_menu();

        this.page.set_secondary_action(__('Customize'), () => {
            this.customize();
        });

        this.page.add_menu_item(__('Reset Customizations'), () => {
            this.current_page.reset_customization();
        }, 1);

        this.page.add_menu_item(__('Toggle Sidebar'), () => {
            this.toggle_side_bar();
        }, 1);
    }

    toggle_side_bar() {
        let show_workspace_sidebar = JSON.parse(localStorage.show_workspace_sidebar || "true");
        show_workspace_sidebar = !show_workspace_sidebar;
        localStorage.show_workspace_sidebar = show_workspace_sidebar;
        this.show_or_hide_sidebar();
        $(document.body).trigger("toggleDeskSidebar");
    }

    show_or_hide_sidebar() {
        let show_workspace_sidebar = JSON.parse(localStorage.show_workspace_sidebar || "true");
        $('#page-workspace .layout-side-section').toggleClass('hidden', !show_workspace_sidebar);
    }
};

async function alertaLicenciasCertificados() {

    if (frappe.user.has_role('Supervisor Nacional') && !frappe.user.has_role('System Manager')) {

        const getDocumentsLicencias = await frappe.db.get_list('Licencias y Certificados', {
            'filters': [],
            'limit': 'None',
            'fields': ['fecha_de_fin_1', 'fecha_de_fin_2', 'fecha_de_fin_3', 'fecha_de_fin_4', 'fecha_de_fin_5', 'fecha_de_fin_6', 'fecha_de_fin_7', 'fecha_de_fin_8']
        });

        let path = 'https://capacitacion.shalom.com.pe/app/licencias-y-certificados?'
        let path2 = '=%5B"<"%2C"'
        let path3 = '"%5D'
        let documentForRevision = {
            licenciaFuncionamiento: {
                porVencer: 0,
                vencidos: 0
            },
            licenciaAnunciosPubliciarios: {
                porVencer: 0,
                vencidos: 0
            },
            certificadoItse: {
                porVencer: 0,
                vencidos: 0
            },
            certificadoFumigacion: {
                porVencer: 0,
                vencidos: 0
            },
            certificadoPozoTierra: {
                porVencer: 0,
                vencidos: 0
            },
            certificadoExtintores: {
                porVencer: 0,
                vencidos: 0
            },
            certificadoDetectoresHumo: {
                porVencer: 0,
                vencidos: 0
            },
            certificadoLucesEmergencia: {
                porVencer: 0,
                vencidos: 0
            },
        }

        let fechaActual = moment().format("YYYY-MM-DD")
        let fechaSubtractOneMonth = moment(fechaActual).add(1, 'month').format("YYYY-MM-DD")

        let fechaLicenciaFuncionamiento = ''
        let fechaLicenciaFuncionamientoPorvencer = ''
        let fechaLicenciaFuncionamientoVencido = ''

        let fechaLicenciaAnunciosPubliciarios = ''
        let fechaLicenciaAnunciosPubliciariosPorVencer = ''
        let fechaLicenciaAnunciosPubliciariosVencido = ''

        let fechaCertificadoItse = ''
        let fechaCertificadoItsePorVencer = ''
        let fechaCertificadoItseVencido = ''

        let fechaCertificadoFumigacion = ''
        let fechaCertificadoFumigacionPorVencer = ''
        let fechaCertificadoFumigacionVencido = ''

        let fechaCertificadoPozoTierra = ''
        let fechaCertificadoPozoTierraPorVencer = ''
        let fechaCertificadoPozoTierraVencido = ''

        let fechaCertificadoExtintores = ''
        let fechaCertificadoExtintoresPorVencer = ''
        let fechaCertificadoExtintoresVencido = ''

        let fechaCertificadoDetectoresHumo = ''
        let fechaCertificadoDetectoresHumoPorVencer = ''
        let fechaCertificadoDetectoresHumoVencido = ''

        let fechaCertificadoLucesEmergencia = ''
        let fechaCertificadoLucesEmergenciaPorVencer = ''
        let fechaCertificadoLucesEmergenciaVencido = ''

        for (let item of getDocumentsLicencias) {
            fechaLicenciaFuncionamiento = moment(item.fecha_de_fin_1).format("YYYY-MM-DD")
            fechaLicenciaFuncionamientoPorvencer = moment(fechaLicenciaFuncionamiento).subtract(1, 'month').format("YYYY-MM-DD")
            fechaLicenciaFuncionamientoVencido = moment(fechaLicenciaFuncionamiento).add(1, 'days').format("YYYY-MM-DD")

            fechaLicenciaAnunciosPubliciarios = moment(item.fecha_de_fin_2).format("YYYY-MM-DD")
            fechaLicenciaAnunciosPubliciariosPorVencer = moment(fechaLicenciaAnunciosPubliciarios).subtract(1, 'month').format("YYYY-MM-DD")
            fechaLicenciaAnunciosPubliciariosVencido = moment(fechaLicenciaAnunciosPubliciarios).add(1, 'days').format("YYYY-MM-DD")

            fechaCertificadoItse = moment(item.fecha_de_fin_3).format("YYYY-MM-DD")
            fechaCertificadoItsePorVencer = moment(fechaCertificadoItse).subtract(1, 'month').format("YYYY-MM-DD")
            fechaCertificadoItseVencido = moment(fechaCertificadoItse).add(1, 'days').format("YYYY-MM-DD")

            fechaCertificadoFumigacion = moment(item.fecha_de_fin_4).format("YYYY-MM-DD")
            fechaCertificadoFumigacionPorVencer = moment(fechaCertificadoFumigacion).subtract(1, 'month').format("YYYY-MM-DD")
            fechaCertificadoFumigacionVencido = moment(fechaCertificadoFumigacion).add(1, 'days').format("YYYY-MM-DD")

            fechaCertificadoPozoTierra = moment(item.fecha_de_fin_5).format("YYYY-MM-DD")
            fechaCertificadoPozoTierraPorVencer = moment(fechaCertificadoPozoTierra).subtract(1, 'month').format("YYYY-MM-DD")
            fechaCertificadoPozoTierraVencido = moment(fechaCertificadoPozoTierra).add(1, 'days').format("YYYY-MM-DD")

            fechaCertificadoExtintores = moment(item.fecha_de_fin_6).format("YYYY-MM-DD")
            fechaCertificadoExtintoresPorVencer = moment(fechaCertificadoExtintores).subtract(1, 'month').format("YYYY-MM-DD")
            fechaCertificadoExtintoresVencido = moment(fechaCertificadoExtintores).add(1, 'days').format("YYYY-MM-DD")

            fechaCertificadoDetectoresHumo = moment(item.fecha_de_fin_7).format("YYYY-MM-DD")
            fechaCertificadoDetectoresHumoPorVencer = moment(fechaCertificadoDetectoresHumo).subtract(1, 'month').format("YYYY-MM-DD")
            fechaCertificadoDetectoresHumoVencido = moment(fechaCertificadoDetectoresHumo).add(1, 'days').format("YYYY-MM-DD")

            fechaCertificadoLucesEmergencia = moment(item.fecha_de_fin_8).format("YYYY-MM-DD")
            fechaCertificadoLucesEmergenciaPorVencer = moment(fechaCertificadoLucesEmergencia).subtract(1, 'month').format("YYYY-MM-DD")
            fechaCertificadoLucesEmergenciaVencido = moment(fechaCertificadoLucesEmergencia).add(1, 'days').format("YYYY-MM-DD")

            if (fechaActual >= fechaLicenciaFuncionamientoVencido) {
                documentForRevision.licenciaFuncionamiento.vencidos++
            } else if (fechaLicenciaFuncionamientoPorvencer <= fechaActual) {
                documentForRevision.licenciaFuncionamiento.porVencer++
            }

            if (fechaActual >= fechaLicenciaAnunciosPubliciariosVencido) {
                documentForRevision.licenciaAnunciosPubliciarios.vencidos++
            } else if (fechaLicenciaAnunciosPubliciariosPorVencer <= fechaActual) {
                documentForRevision.licenciaAnunciosPubliciarios.porVencer++
            }

            if (fechaActual >= fechaCertificadoItseVencido) {
                documentForRevision.certificadoItse.vencidos++
            } else if (fechaCertificadoItsePorVencer <= fechaActual) {
                documentForRevision.certificadoItse.porVencer++
            }

            if (fechaActual >= fechaCertificadoFumigacionVencido) {
                documentForRevision.certificadoFumigacion.vencidos++
            } else if (fechaCertificadoFumigacionPorVencer <= fechaActual) {
                documentForRevision.certificadoFumigacion.porVencer++
            }

            if (fechaActual >= fechaCertificadoPozoTierraVencido) {
                documentForRevision.certificadoPozoTierra.vencidos++
            } else if (fechaCertificadoPozoTierraPorVencer <= fechaActual) {
                documentForRevision.certificadoPozoTierra.porVencer++
            }

            if (fechaActual >= fechaCertificadoExtintoresVencido) {
                documentForRevision.certificadoExtintores.vencidos++
            } else if (fechaCertificadoExtintoresPorVencer <= fechaActual) {
                documentForRevision.certificadoExtintores.porVencer++
            }

            if (fechaActual >= fechaCertificadoDetectoresHumoVencido) {
                documentForRevision.certificadoDetectoresHumo.vencidos++
            } else if (fechaCertificadoDetectoresHumoPorVencer <= fechaActual) {
                documentForRevision.certificadoDetectoresHumo.porVencer++
            }

            if (fechaActual >= fechaCertificadoLucesEmergenciaVencido) {
                documentForRevision.certificadoLucesEmergencia.vencidos++
            } else if (fechaCertificadoLucesEmergenciaPorVencer <= fechaActual) {
                documentForRevision.certificadoLucesEmergencia.porVencer++
            }
        }
        if (documentForRevision.licenciaFuncionamiento.porVencer > 0 || documentForRevision.licenciaFuncionamiento.vencidos > 0
            || documentForRevision.licenciaAnunciosPubliciarios.porVencer > 0 || documentForRevision.licenciaAnunciosPubliciarios.vencidos > 0
            || documentForRevision.certificadoItse.porVencer > 0 || documentForRevision.certificadoItse.vencidos > 0
            || documentForRevision.certificadoFumigacion.porVencer > 0 || documentForRevision.certificadoFumigacion.vencidos > 0
            || documentForRevision.certificadoPozoTierra.porVencer > 0 || documentForRevision.certificadoPozoTierra.vencidos > 0
            || documentForRevision.certificadoExtintores.porVencer > 0 || documentForRevision.certificadoExtintores.vencidos > 0
            || documentForRevision.certificadoDetectoresHumo.porVencer > 0 || documentForRevision.certificadoDetectoresHumo.vencidos > 0
            || documentForRevision.certificadoLucesEmergencia.porVencer > 0 || documentForRevision.certificadoLucesEmergencia.vencidos > 0
        ) {


            let tabla =
                `<div id="seccion_licencias_certificados">		
			<table class="table table-hover" id="table_licencias_certificados">
			<thead>
			<tr>
			<th scope="col" style="padding: 1rem">LICENCIA/CERTIFICADO</th>
			<th scope="col" style="padding: 1rem">POR VENCER</th>
			<th scope="col" style="padding: 1rem">VENCIDOS</th>
			</tr>
			</thead>
			</table>
			</div>
			`
            frappe.msgprint(tabla)
            setTimeout(() => {
                let table_licencias_id = document.getElementById('table_licencias_certificados')
                let body_table = document.createElement('tbody')

                //Fila 1
                let fila = document.createElement('tr')
                fila.id = 'Licencia de Funcionamiento'

                let td = document.createElement('td')
                td.innerText = 'Licencia de Funcionamiento'

                let td2 = document.createElement('td')
                td2.style.textAlign = 'center'
                td2.innerHTML = (documentForRevision.licenciaFuncionamiento.porVencer !== 0) ? `<buton class="btn btn-success">${documentForRevision.licenciaFuncionamiento.porVencer}</buton>` : `${documentForRevision.licenciaFuncionamiento.porVencer}`

                let td3 = document.createElement('td')
                td3.style.textAlign = 'center'
                td3.innerHTML = (documentForRevision.licenciaFuncionamiento.vencidos !== 0) ? `<buton class="btn btn-success">${documentForRevision.licenciaFuncionamiento.vencidos} </buton>` : `${documentForRevision.licenciaFuncionamiento.vencidos}`

                td2.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_1=%5B%22Between%22%2C%5B%22' + fechaActual + '%22%2C%22' + fechaSubtractOneMonth + '%22%5D%5D', '_blank');
                }

                td3.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_1=%5B"<"%2C"' + fechaActual + '"%5D', '_blank');
                }
                //Fila 2
                let fila2 = document.createElement('tr')
                fila2.id = 'Licencia de Anuncios Publicitarios'

                let td4 = document.createElement('td')
                td4.innerText = 'Licencia de Anuncios Publicitarios'

                let td5 = document.createElement('td')
                td5.style.textAlign = 'center'
                td5.innerHTML = (documentForRevision.licenciaAnunciosPubliciarios.porVencer !== 0) ? `<buton class="btn btn-success">${documentForRevision.licenciaAnunciosPubliciarios.porVencer}</buton>` : `${documentForRevision.licenciaAnunciosPubliciarios.porVencer}`

                let td6 = document.createElement('td')
                td6.style.textAlign = 'center'
                td6.innerHTML = (documentForRevision.licenciaAnunciosPubliciarios.vencidos !== 0) ? `<buton class="btn btn-success">${documentForRevision.licenciaAnunciosPubliciarios.vencidos} </buton>` : `${documentForRevision.licenciaAnunciosPubliciarios.vencidos}`

                td5.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_2=%5B%22Between%22%2C%5B%22' + fechaActual + '%22%2C%22' + fechaSubtractOneMonth + '%22%5D%5D', '_blank');
                }

                td6.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_2=%5B"<"%2C"' + fechaActual + '"%5D', '_blank');
                }
                //fila 3
                let fila3 = document.createElement('tr')
                fila3.id = 'Certificado Itse'

                let td7 = document.createElement('td')
                td7.innerText = 'Certificado Itse'

                let td8 = document.createElement('td')
                td8.style.textAlign = 'center'
                td8.innerHTML = (documentForRevision.certificadoItse.porVencer !== 0) ? `<buton class="btn btn-success">${documentForRevision.certificadoItse.porVencer}</buton>` : `${documentForRevision.certificadoItse.porVencer}`

                let td9 = document.createElement('td')
                td9.style.textAlign = 'center'
                td9.innerHTML = (documentForRevision.certificadoItse.vencidos !== 0) ? `<buton class="btn btn-success">${documentForRevision.certificadoItse.vencidos} </buton>` : `${documentForRevision.certificadoItse.vencidos}`

                td8.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_3=%5B%22Between%22%2C%5B%22' + fechaActual + '%22%2C%22' + fechaSubtractOneMonth + '%22%5D%5D', '_blank');
                }

                td9.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_3=%5B"<"%2C"' + fechaActual + '"%5D', '_blank');
                }
                //fila4
                let fila4 = document.createElement('tr')
                fila4.id = 'Certificado de Fumigacion'

                let td10 = document.createElement('td')
                td10.innerText = 'Certificado de fumigación'

                let td11 = document.createElement('td')
                td11.style.textAlign = 'center'
                td11.innerHTML = (documentForRevision.certificadoFumigacion.porVencer !== 0) ? `<buton class="btn btn-success">${documentForRevision.certificadoFumigacion.porVencer}</buton>` : `${documentForRevision.certificadoFumigacion.porVencer}`

                let td12 = document.createElement('td')
                td12.style.textAlign = 'center'
                td12.innerHTML = (documentForRevision.certificadoFumigacion.vencidos !== 0) ? `<buton class="btn btn-success">${documentForRevision.certificadoFumigacion.vencidos} </buton>` : `${documentForRevision.certificadoFumigacion.vencidos}`

                td11.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_4=%5B%22Between%22%2C%5B%22' + fechaActual + '%22%2C%22' + fechaSubtractOneMonth + '%22%5D%5D', '_blank');
                }

                td12.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_4=%5B"<"%2C"' + fechaActual + '"%5D', '_blank');
                }
                //fila 5
                let fila5 = document.createElement('tr')
                fila5.id = 'Certificado Pozo a Tierra'

                let td13 = document.createElement('td')
                td13.innerText = 'Certificado Pozo a Tierra'

                let td14 = document.createElement('td')
                td14.style.textAlign = 'center'
                td14.innerHTML = (documentForRevision.certificadoPozoTierra.porVencer !== 0) ? `<buton class="btn btn-success">${documentForRevision.certificadoPozoTierra.porVencer}</buton>` : `${documentForRevision.certificadoPozoTierra.porVencer}`

                let td15 = document.createElement('td')
                td15.style.textAlign = 'center'
                td15.innerHTML = (documentForRevision.certificadoPozoTierra.vencidos !== 0) ? `<buton class="btn btn-success">${documentForRevision.certificadoPozoTierra.vencidos} </buton>` : `${documentForRevision.certificadoPozoTierra.vencidos}`

                td14.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_5=%5B%22Between%22%2C%5B%22' + fechaActual + '%22%2C%22' + fechaSubtractOneMonth + '%22%5D%5D', '_blank');
                }

                td15.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_5=%5B"<"%2C"' + fechaActual + '"%5D', '_blank');
                }
                // fila 6
                let fila6 = document.createElement('tr')
                fila6.id = 'Certificado de Extintores'

                let td16 = document.createElement('td')
                td16.innerText = 'Certificado de Extintores'

                let td17 = document.createElement('td')
                td17.style.textAlign = 'center'
                td17.innerHTML = (documentForRevision.certificadoExtintores.porVencer !== 0) ? `<buton class="btn btn-success">${documentForRevision.certificadoExtintores.porVencer}</buton>` : `${documentForRevision.certificadoExtintores.porVencer}`

                let td18 = document.createElement('td')
                td18.style.textAlign = 'center'
                td18.innerHTML = (documentForRevision.certificadoExtintores.vencidos !== 0) ? `<buton class="btn btn-success">${documentForRevision.certificadoExtintores.vencidos} </buton>` : `${documentForRevision.certificadoExtintores.vencidos}`

                td17.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_6=%5B%22Between%22%2C%5B%22' + fechaActual + '%22%2C%22' + fechaSubtractOneMonth + '%22%5D%5D', '_blank');
                }

                td18.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_6=%5B"<"%2C"' + fechaActual + '"%5D', '_blank');
                }

                // fila 7
                let fila7 = document.createElement('tr')
                fila7.id = 'Certificado de Detectores de Humo'

                let td19 = document.createElement('td')
                td19.innerText = 'Certificado de Detectores de Humo'

                let td20 = document.createElement('td')
                td20.style.textAlign = 'center'
                td20.innerHTML = (documentForRevision.certificadoDetectoresHumo.porVencer !== 0) ? `<buton class="btn btn-success">${documentForRevision.certificadoDetectoresHumo.porVencer}</buton>` : `${documentForRevision.certificadoDetectoresHumo.porVencer}`

                let td21 = document.createElement('td')
                td21.style.textAlign = 'center'
                td21.innerHTML = (documentForRevision.certificadoDetectoresHumo.vencidos !== 0) ? `<buton class="btn btn-success">${documentForRevision.certificadoDetectoresHumo.vencidos} </buton>` : `${documentForRevision.certificadoDetectoresHumo.vencidos}`

                td20.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_7=%5B%22Between%22%2C%5B%22' + fechaActual + '%22%2C%22' + fechaSubtractOneMonth + '%22%5D%5D', '_blank');
                }

                td21.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_7=%5B"<"%2C"' + fechaActual + '"%5D', '_blank');
                }

                // fila 8
                let fila8 = document.createElement('tr')
                fila8.id = 'Certificado de Luces de Emergencia'

                let td22 = document.createElement('td')
                td22.innerText = 'Certificado de Luces de Emergencia'

                let td23 = document.createElement('td')
                td23.style.textAlign = 'center'
                td23.innerHTML = (documentForRevision.certificadoLucesEmergencia.porVencer !== 0) ? `<buton class="btn btn-success">${documentForRevision.certificadoLucesEmergencia.porVencer}</buton>` : `${documentForRevision.certificadoLucesEmergencia.porVencer}`

                let td24 = document.createElement('td')
                td24.style.textAlign = 'center'
                td24.innerHTML = (documentForRevision.certificadoLucesEmergencia.vencidos !== 0) ? `<buton class="btn btn-success">${documentForRevision.certificadoLucesEmergencia.vencidos} </buton>` : `${documentForRevision.certificadoLucesEmergencia.vencidos}`

                td23.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_8=%5B%22Between%22%2C%5B%22' + fechaActual + '%22%2C%22' + fechaSubtractOneMonth + '%22%5D%5D', '_blank');
                }

                td24.onclick = async function () {
                    window.open('https://capacitacion.shalom.com.pe/app/licencias-y-certificados?fecha_de_fin_8=%5B"<"%2C"' + fechaActual + '"%5D', '_blank');
                }
                //Creando columnas a fila
                fila.appendChild(td)
                fila.appendChild(td2)
                fila.appendChild(td3)

                fila2.appendChild(td4)
                fila2.appendChild(td5)
                fila2.appendChild(td6)

                fila3.appendChild(td7)
                fila3.appendChild(td8)
                fila3.appendChild(td9)

                fila4.appendChild(td10)
                fila4.appendChild(td11)
                fila4.appendChild(td12)

                fila5.appendChild(td13)
                fila5.appendChild(td14)
                fila5.appendChild(td15)

                fila6.appendChild(td16)
                fila6.appendChild(td17)
                fila6.appendChild(td18)

                fila7.appendChild(td19)
                fila7.appendChild(td20)
                fila7.appendChild(td21)

                fila8.appendChild(td22)
                fila8.appendChild(td23)
                fila8.appendChild(td24)

                //Creando filas al body
                body_table.appendChild(fila)
                body_table.appendChild(fila2)
                body_table.appendChild(fila3)
                body_table.appendChild(fila4)
                body_table.appendChild(fila5)
                body_table.appendChild(fila6)
                body_table.appendChild(fila7)
                body_table.appendChild(fila8)
                //Creando body a la tabla
                table_licencias_id.appendChild(body_table)

            }, 1000)
        }
    }
}

async function alertaContratosAlquiler() {

    if (frappe.user.has_role('Supervisor Nacional') && !frappe.user.has_role('System Manager') ) {

        const getDocumentsContratos = await frappe.db.get_list('Solicitud de Contratos Alquiler', {
            'filters': {
                'estado_del_documento': 'Habilitado',
            },
            'limit': 'None',
            'fields': ['name', 'sucursal', 'estado_del_documento', 'fecha_de_fin_contrato']
        });

        let solicitudContratos = []

        let fechaActual = moment().format("YYYY-MM-DD")
        let fechaSubtractOneMonth = moment(fechaActual).add(1, 'month').format("YYYY-MM-DD")

        let fechaContratoAlquiler = ''
        let fechaContratoAlquilerPorvencer = ''
        let fechaContratoAlquilerVencido = ''

        let tablaAlertaContratos = ''
        tablaAlertaContratos += `
					<div id="seccion_asistencia">
						<table class="table table-hover" id="tablaDeAlertaContratos">
						<thead>
							<tr>
							  <th scope="col" style="padding: 1rem ; text-align: center">Solicitud de Contratos</th>
							  <th scope="col" style="padding: 1rem ; text-align: center">Sucursal</th>
							  <th scope="col" style="padding: 1rem ; text-align: center">Estado</th>
							  <th scope="col" style="padding: 1rem ; text-align: center">Detalle</th>
							</tr>
						</thead>
						<tbody>
						`

        for (let item of getDocumentsContratos) {
            fechaContratoAlquiler = moment(item.fecha_de_fin_contrato).format("YYYY-MM-DD")
            fechaContratoAlquilerPorvencer = moment(fechaContratoAlquiler).subtract(3, 'days').format("YYYY-MM-DD")
            fechaContratoAlquilerVencido = moment(fechaContratoAlquiler).add(1, 'days').format("YYYY-MM-DD")
            if (fechaActual >= fechaContratoAlquilerVencido) {
                solicitudContratos.push({
                    name: item.name,
                    sucursal: item.sucursal,
                    estado: 'Vencido',
                })

            } else if (fechaContratoAlquilerPorvencer <= fechaActual) {
                solicitudContratos.push({
                    name: item.name,
                    sucursal: item.sucursal,
                    estado: 'Por vencer',
                })
            }
        }
        for (let i = 0; i < solicitudContratos.length; i++) {
            tablaAlertaContratos += `
				<tr>
				<td style="text-align: center;">${solicitudContratos[i].name}</td>
				<td style="text-align: center;">${solicitudContratos[i].sucursal}</td>
				<td style="text-align: center;">${solicitudContratos[i].estado}</td>
				<td style="text-align: center;"><a class="btn btn-primary btn-block" href="https://capacitacion-16-08-2023.shalom.com.pe/app/solicitud-de-contratos-alquiler/${solicitudContratos[i].name}" target="_blank">Ir</a></td>
				</tr>
				`
        }
        tablaAlertaContratos += `
			</tbody>
			</table>
			</div>`
        frappe.utils.play_sound("submit");
        frappe.msgprint({
            title: __('Notification'),
            message: __(tablaAlertaContratos)
        });

    }
}

async function accessInspeccionModels() {

    let userLogin = frappe.user.name;

    console.log(userLogin, 'userLogin')

    const getDataEmployee = await frappe.db.get_list('Employee', {
        filters: {
            'user_id': userLogin
        },
        fields: ["name", "branch"]
    });

    console.log(getDataEmployee, 'getDataEmployee')

    if (!getDataEmployee || getDataEmployee.length === 0 || !getDataEmployee[0].branch) {
        return;
    }
    let sucursal = getDataEmployee[0].branch;

    const getDataBranch = await frappe.db.get_list("Inspeccion SSOMA", {
        filters: {
            'parent': sucursal
        },
        fields: ["acceso", "inspeccion_ssoma"]
    });

    console.log(getDataBranch, 'getDataBranch')

    if (!getDataBranch.length) {
        return ;
    }

    let ocultar = [];
    let mostrar = [];

    for (let i = 0; i < getDataBranch.length; i++) {
        if (getDataBranch[i].acceso == 0) {
            ocultar.push(getDataBranch[i].inspeccion_ssoma);
        }
        if (getDataBranch[i].acceso == 1) {
            mostrar.push(getDataBranch[i].inspeccion_ssoma);
        }
    }

    console.log(ocultar, 'ocultar')
    console.log(mostrar, 'mostrar')
    console.log(frappe.user.has_role("Usuario SSOMA"), 'ssoma?')

    if (frappe.user.has_role("Usuario SSOMA")) {
        return;
    }
    setTimeout(() => {

        let cardBreakHR = $("[data-widget-name='b1f215c99b']").length
        if (!(cardBreakHR > 0)) {
            return ;
        }
        let cardSalida = $("[data-widget-name='b1f215c99b']")[0].childNodes[3].childNodes
        for (let i = 0; i < cardSalida.length; i++) {
            if (i === 0) continue
            let dom = cardSalida[i];
            let ga = dom.textContent;
            let content = ga.replaceAll('\t', '');
            content = content.replaceAll('\n', '');
            if (ocultar.includes(content)) {
                $("[data-widget-name='b1f215c99b']")[0].childNodes[3].childNodes[i].hidden = true;
                console.log($("[data-widget-name='b1f215c99b']")[0].childNodes[3].childNodes[i],'ocultar')
            }
            if (mostrar.includes(content)) {
                $("[data-widget-name='b1f215c99b']")[0].childNodes[3].childNodes[i].hidden = false;
                console.log($("[data-widget-name='b1f215c99b']")[0].childNodes[3].childNodes[i].hidden,'mostrar')
            }
        }

        // if (mostrar.length !== 0) {
        //     return ;
        // }
        // $("[data-widget-name='61b70caf29']").hide()
    }, 1000)

}

async function votacion(userLogin) {

    let response = await $.ajax({
        type:"GET",
        url:'https://recursoshumanos.shalom.com.pe/web/job-applicant/verified-vote/'+userLogin,
        dataType:"JSON"
    });

    if ( !response.status ) {
        return false
    }

    let mensajeHtml = ` <div>
                            <h4>Usted tiene pendiente realizar su voto en las elecciones para el comité de intervención frente al hostigamiento sexual</h4>
                        </div>`


    frappe.msgprint(mensajeHtml)
    setTimeout(() => {

        window.location.href = 'https://capacitacion.shalom.com.pe/elecciones-de-comite?new=1'

    }, 4000)


}

async function alertaControlLlamadas () {
    frappe.call({
        method: 'erpnext.hr.doctype.apartado_descanso_medico.apartado_descanso_medico.get_data',
        callback: function(r) {

            let items = r.message.data

            if ( items.length === 0 ) return false

            // $('.modal-content').css({'height': '900px'});

            let messageAlert =`
                <div class="section-head text-center mx-4 text-uppercase font-weight-bold">
                    ALERTA CONTROL DE LLAMADAS POR DESCANSOS MÉDICOS
                </div>
				<div class="mt-4 mb-4 frappe-control form-group mx-4" data-fieldtype="Table" data-fieldname="his_contratos" title="his_contratos">
    				<div class="form-grid">
						  <div class="grid-heading-row">
							<div class="grid-row">
							  <div class="data-row row">
								<div class="head col grid-static-col col-xs-4" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold mt-3">Nombre Completo</div>
								</div>
								<div class="head col grid-static-col col-xs-2" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Llamadas <br> Realizadas</div>
								</div>
								<div class="head col grid-static-col col-xs-2" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Llamadas <br> Programadas</div>
								</div>
								<div class="head col grid-static-col col-xs-2" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Fecha Final<br>de Descanso</div>
								</div>
								<div class="head col grid-static-col col-xs-2" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold mt-3">Ir</div>
								</div>
							  </div>
							</div>
							<div class="grid-body">
                                <div class="rows">
                                    <div class="spinner-border text-primary" role="status" id="loading_spinner" style="margin-left: 440px;margin-top: 10px; margin-bottom: 5px">
                                      <span class="visually-hidden"></span>
                                    </div>
                                    <div id="table_calls" style="display: none">
                                    </div>
                                    <div id="attendance_cero" class="grid-empty text-center" style="display: none">
                                        <img src="https://capacitacion.shalom.com.pe/assets/frappe/images/ui-states/grid-empty-state.svg" alt="Grid Empty State" class="grid-empty-illustration">
                                        No hay datos
                                    </div>
                                </div>
				  	        </div>
						  </div>
    				</div>
  				</div>`

            frappe.msgprint({
                title: __('Notification'),
                message: __(messageAlert)
            });

            let tamanoModal = document.getElementsByClassName('modal-content')
            let tamanoModalGeneral = document.getElementsByClassName('modal-dialog')

            setTimeout(()=>{
                tamanoModal[0].style.width = "900px"
                tamanoModalGeneral[0].style.maxWidth = "800px"
                $('.head').css({'height': '60px'});

                let table_attendance = document.getElementById('table_calls')
                let loadingSpinner = document.getElementById('loading_spinner')

                for( const item of items ) {

                    if ( item.qtyCallsOpen < item.qtyCalls ) {
                        let reallyDivParent = document.createElement('div')
                        reallyDivParent.classList.add('grid-row')

                        let divParent = document.createElement('div')
                        divParent.classList.add('data-row', 'row')

                        let divChildrenOne = document.createElement('div')
                        divChildrenOne.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-4');
                        let spanOne = document.createElement('span')
                        spanOne.classList.add('text-left', 'font-weight-bold');
                        spanOne.innerHTML = item.fullName
                        spanOne.style.display = 'block'

                        let divChildrenTwo = document.createElement('div')
                        divChildrenTwo.classList.add('col', 'grid-static-col', 'col-xs-2', 'text-center');
                        let spanTwo = document.createElement('div')
                        spanTwo.classList.add('field-area', 'static-area', 'ellipsis');
                        spanTwo.innerHTML = item.qtyCallsOpen
                        spanTwo.style.fontSize = '14px'

                        let divChildrenThree = document.createElement('div')
                        divChildrenThree.classList.add('col', 'grid-static-col', 'col-xs-2', 'text-center');
                        let spanThree = document.createElement('div')
                        spanThree.classList.add('field-area', 'static-area', 'ellipsis');
                        spanThree.innerHTML = item.qtyCalls
                        spanThree.style.fontSize = '14px'

                        let divChildrenFour = document.createElement('div')
                        divChildrenFour.classList.add('col', 'grid-static-col', 'col-xs-2', 'text-center');
                        let spanFour = document.createElement('div')
                        spanFour.classList.add('field-area', 'static-area', 'ellipsis');
                        spanFour.innerHTML = item.endDate
                        spanFour.style.fontSize = '14px'

                        let divChildrenFive = document.createElement('div')
                        divChildrenFive.classList.add('col', 'grid-static-col', 'col-xs-2', 'text-center');
                        divChildrenFive.style.padding = '1px'
                        let buttonOne = document.createElement('button')
                        buttonOne.classList.add('field-area', 'static-area', 'ellipsis', 'btn', 'btn-primary', 'btn-xl', 'primary-action');
                        buttonOne.innerText = 'ABRIR DOC'

                        buttonOne.onclick = async  function( e ) {
                            window.open('https://capacitacion.shalom.com.pe/app/apartado-descanso-medico/'+item.nameDocument, '_blank');
                        }

                        divChildrenOne.appendChild(spanOne)
                        divChildrenTwo.appendChild(spanTwo)
                        divChildrenThree.appendChild(spanThree)
                        divChildrenFour.appendChild(spanFour)
                        divChildrenFive.appendChild(buttonOne)

                        divParent.appendChild(divChildrenOne)
                        divParent.appendChild(divChildrenTwo)
                        divParent.appendChild(divChildrenThree)
                        divParent.appendChild(divChildrenFour)
                        divParent.appendChild(divChildrenFive)

                        reallyDivParent.appendChild(divParent)

                        table_attendance.appendChild(reallyDivParent)
                    }
                }

                $('#loading_spinner').hide();
                $('#table_calls').show();
                $('.head').css({'height': '60px'});

            },1000)



        },
        error: function(err) {
            console.log('Error en la llamada al servicio:', err);
        }
    });

}

class DesktopPage {
    constructor({container, page_name}) {
        frappe.desk_page = this;
        this.container = container;
        this.page_name = page_name;
        this.sections = {};
        this.allow_customization = false;
        this.reload();
    }

    show() {
        frappe.desk_page = this;
        this.page.show();
        if (this.sections.shortcuts) {
            this.sections.shortcuts.widgets_list.forEach(wid => {
                wid.set_actions();
            });
        }
    }

    hide() {
        this.page.hide();
    }

    async reload() {

        let rolesUser = frappe.user_roles;
        let userLogin = frappe.user.name;
        if ( rolesUser.includes("Bienestar Social") && !frappe.user.has_role('System Manager') ) await alertaControlLlamadas()

        // if ( !rolesUser.includes("System Manager") ) {
        //     votacion(userLogin)
        // }

        //alertaContratosAlquiler()
        //alertaLicenciasCertificados()
        accessInspeccionModels(userLogin)

        const getDataOfEmployee = await frappe.db.get_list('Employee', {
            filters: {
                'user_id': userLogin
            },
            fields: ['*']
        });

        setTimeout(() => {

            if ( !rolesUser.includes("HR Manager")) {
                let cardBreakHR = $("[data-widget-name='5d656950b8']")
                cardBreakHR[0].hidden = true;
            }else{
                let cardBreakHR = $("[data-widget-name='5d656950b8']")
                cardBreakHR[0].hidden = false;
            }

            if (getDataOfEmployee.length > 0) {

                if (getDataOfEmployee[0].zona_recursos == 'LIMA' || getDataOfEmployee[0].zona_recursos == 'TERMINALES' && (getDataOfEmployee[0].department != 'Recursos Humanos - SE')) {

                    let cardBreakHR = $("[data-widget-name='bd96599d85']").length

                    if (cardBreakHR > 0) {

                        if ($("[data-widget-name='bd96599d85']")[0].childNodes[3].childNodes.length > 0) {

                            let cardSalida = $("[data-widget-name='bd96599d85']")[0].childNodes[3].childNodes;

                            for (let i = 0; i < cardSalida.length; i++) {

                                let dom = cardSalida[i]
                                let ga = dom.textContent;

                                let content = ga.replaceAll('\t', '');
                                content = content.replaceAll('\n', '');

                                if (content == 'Liquidacion Mensual') {

                                    $("[data-widget-name='bd96599d85']")[0].childNodes[3].childNodes[i].hidden = true;

                                }


                            }

                        }

                    }

                }

            }
            if (!rolesUser.includes("HR Manager") && !rolesUser.includes("HR User") &&
                !userLogin.includes("45738484@shalomcontrol.com") && !userLogin.includes("43735125@shalomcontrol.com") &&
                !userLogin.includes("kittycastaneda@shalom.com.pe") && !userLogin.includes("70464702@shalomcontrol.com")
            ) {

                let cardBreakNominas = $("[data-widget-name='93f9c5b22d']").length;

                if (cardBreakNominas > 0) {

                    let cardNomina = $("[data-widget-name='93f9c5b22d']")[0].childNodes[3].childNodes;

                    for (let i = 0; i < cardNomina.length; i++) {

                        let dom = cardNomina[i]
                        let ga = dom.textContent;

                        let content = ga.replaceAll('\t', '');
                        content = content.replaceAll('\n', '');

                        if (content == 'Bonos Nacionales') {

                            $("[data-widget-name='93f9c5b22d']")[0].childNodes[3].childNodes[i].hidden = true;

                        }


                    }

                }

            }

        }, 1000)

        this.in_customize_mode = false;
        this.page && this.page.remove();
        this.make();
    }

    make() {
        this.page = $(`<div class="desk-page" data-page-name=${this.page_name}></div>`);
        this.page.append(frappe.render_template('workspace_loading_skeleton'));
        this.page.appendTo(this.container);

        this.get_data().then(() => {
            if (Object.keys(this.data).length == 0) {
                delete localStorage.current_workspace;
                frappe.set_route("workspace");
                return;
            }
            this.refresh();
        }).finally(this.page.find('.workspace_loading_skeleton').remove);
    }

    refresh() {
        this.page.empty();
        this.allow_customization = this.data.allow_customization || false;

        if (frappe.is_mobile()) {
            this.allow_customization = false;
        }

        this.data.onboarding && this.data.onboarding.items.length && this.make_onboarding();
        this.make_charts();
        this.make_shortcuts();
        this.make_cards();
    }

    get_data() {
        return frappe.xcall("frappe.desk.desktop.get_desktop_page", {
            page: this.page_name
        }).then(data => {
            this.data = data;
            if (Object.keys(this.data).length == 0) return;

            return frappe.dashboard_utils.get_dashboard_settings().then(settings => {
                let chart_config = settings.chart_config ? JSON.parse(settings.chart_config) : {};
                if (this.data.charts.items) {
                    this.data.charts.items.map(chart => {
                        chart.chart_settings = chart_config[chart.chart_name] || {};
                    });
                }
            });
        });
    }

    customize() {
        if (this.in_customize_mode) {
            return;
        }

        // We need to remove this as the  chart group will be visible during customization
        $('.widget.onboarding-widget-box').hide();

        Object.keys(this.sections).forEach(section => {
            this.sections[section].customize();
        });
        this.in_customize_mode = true;

    }

    save_customization() {
        frappe.dom.freeze();
        const config = {};

        if (this.sections.charts) config.charts = this.sections.charts.get_widget_config();
        if (this.sections.shortcuts) config.shortcuts = this.sections.shortcuts.get_widget_config();
        if (this.sections.cards) config.cards = this.sections.cards.get_widget_config();

        frappe.call('frappe.desk.desktop.save_customization', {
            page: this.page_name,
            config: config
        }).then(res => {
            frappe.dom.unfreeze();
            if (res.message) {
                frappe.show_alert({message: __("Customizations Saved Successfully"), indicator: "green"});
                this.reload();
            } else {
                frappe.throw({message: __("Something went wrong while saving customizations"), indicator: "red"});
                this.reload();
            }
        });
    }

    reset_customization() {
        frappe.call('frappe.desk.desktop.reset_customization', {
            page: this.page_name
        }).then(() => {
            frappe.show_alert({message: __("Removed page customizations"), indicator: "green"});
            this.reload();
        });
    }

    make_onboarding() {
        this.onboarding_widget = frappe.widget.make_widget({
            label: this.data.onboarding.label || __("Let's Get Started"),
            subtitle: this.data.onboarding.subtitle,
            steps: this.data.onboarding.items,
            success: this.data.onboarding.success,
            docs_url: this.data.onboarding.docs_url,
            user_can_dismiss: this.data.onboarding.user_can_dismiss,
            widget_type: 'onboarding',
            container: this.page,
            options: {
                allow_sorting: false,
                allow_create: false,
                allow_delete: false,
                allow_hiding: false,
                allow_edit: false,
                max_widget_count: 2,
            }
        });
    }

    make_charts() {
        this.sections["charts"] = new frappe.widget.WidgetGroup({
            container: this.page,
            type: "chart",
            columns: 1,
            class_name: "widget-charts",
            hidden: Boolean(this.onboarding_widget),
            options: {
                allow_sorting: this.allow_customization,
                allow_create: this.allow_customization,
                allow_delete: this.allow_customization,
                allow_hiding: false,
                allow_edit: true,
                max_widget_count: 2,
            },
            widgets: this.data.charts.items
        });
    }

    make_shortcuts() {
        this.sections["shortcuts"] = new frappe.widget.WidgetGroup({
            title: this.data.shortcuts.label || __('Your Shortcuts'),
            container: this.page,
            type: "shortcut",
            columns: 3,
            options: {
                allow_sorting: this.allow_customization,
                allow_create: this.allow_customization,
                allow_delete: this.allow_customization,
                allow_hiding: false,
                allow_edit: true,
            },
            widgets: this.data.shortcuts.items
        });
    }

    make_cards() {
        let cards = new frappe.widget.WidgetGroup({
            title: this.data.cards.label || __("Reports & Masters"),
            container: this.page,
            type: "links",
            columns: 3,
            options: {
                allow_sorting: this.allow_customization,
                allow_create: false,
                allow_delete: false,
                allow_hiding: this.allow_customization,
                allow_edit: false,
            },
            widgets: this.data.cards.items
        });

        this.sections["cards"] = cards;
    }
}


