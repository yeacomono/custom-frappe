// login.js
// don't remove this line (used in test)

window.disable_signup = {{ disable_signup and "true" or "false" }};

window.login = {};

window.verify = {};

login.bind_events = function () {
	$(window).on("hashchange", function () {
		login.route();
	});
	$(".form-login").on("submit", function (event) {
		event.preventDefault();
		var args = {};
		args.cmd = "login";
		args.usr = frappe.utils.xss_sanitise(($("#login_email").val() || "").trim());
		args.pwd = $("#login_password").val();
		args.device = "desktop";
		if (!args.usr || !args.pwd) {
			frappe.msgprint('{{ _("Both login and password required") }}');
			return false;
		}
		login.call(args);
		return false;
	});
	$(".form-signup").on("submit", function (event) {
		event.preventDefault();
		var args = {};
		args.cmd = "frappe.core.doctype.user.user.sign_up";
		args.email = ($("#signup_email").val() || "").trim();
		args.redirect_to = frappe.utils.sanitise_redirect(frappe.utils.get_url_arg("redirect-to"));
		args.full_name = frappe.utils.xss_sanitise(($("#signup_fullname").val() || "").trim());
		if (!args.email || !validate_email(args.email) || !args.full_name) {
			login.set_status('{{ _("Valid email and name required") }}', 'red');
			return false;
		}
		login.call(args);
		return false;
	});
	$(".form-forgot").on("submit", function (event) {
		event.preventDefault();
		var args = {};
		args.cmd = "frappe.core.doctype.user.user.reset_password";
		args.user = ($("#forgot_email").val() || "").trim();
		if (!args.user) {
			login.set_status('{{ _("Valid Login id required.") }}', 'red');
			return false;
		}
		login.call(args);
		return false;
	});
	$(".toggle-password").click(function () {
		var input = $($(this).attr("toggle"));
		if (input.attr("type") == "password") {
			input.attr("type", "text");
			$(this).text('{{ _("Hide") }}')
		} else {
			input.attr("type", "password");
			$(this).text('{{ _("Show") }}')
		}
	});
	{% if ldap_settings and ldap_settings.enabled %}
	$(".btn-ldap-login").on("click", function () {
		var args = {};
		args.cmd = "{{ ldap_settings.method }}";
		args.usr = ($("#login_email").val() || "").trim();
		args.pwd = $("#login_password").val();
		args.device = "desktop";
		if (!args.usr || !args.pwd) {
			login.set_status('{{ _("Both login and password required") }}', 'red');
			return false;
		}
		login.call(args);
		return false;
	});
	{% endif %}
}


login.route = function () {
	var route = window.location.hash.slice(1);
	if (!route) route = "login";
	login[route]();
}

login.reset_sections = function (hide) {
	if (hide || hide === undefined) {
		$("section.for-login").toggle(false);
		$("section.for-email-login").toggle(false);
		$("section.for-forgot").toggle(false);
		$("section.for-signup").toggle(false);
	}
	$('section:not(.signup-disabled) .indicator').each(function () {
		$(this).removeClass().addClass('indicator').addClass('blue')
			.text($(this).attr('data-text'));
	});
}

login.login = function () {
	login.reset_sections();
	$(".for-login").toggle(true);
}

login.email = function () {
	login.reset_sections();
	$(".for-email-login").toggle(true);
	$("#login_email").focus();
}

login.steptwo = function () {
	login.reset_sections();
	$(".for-login").toggle(true);
	$("#login_email").focus();
}

login.forgot = function () {
	login.reset_sections();
	$(".for-forgot").toggle(true);
	$("#forgot_email").focus();
}

login.signup = function () {
	login.reset_sections();
	$(".for-signup").toggle(true);
	$("#signup_fullname").focus();
}

const verifiedSupervition = async (rolUser) => {
	try {
		const branch = rolUser[0].branch;
		const getWarehouse = await $.ajax({
			url: `https://recursoshumanos.shalom.com.pe/module/human/check-storage-supervisions/${branch}`,
			type: "GET",
		});

		if (!getWarehouse.status && (getWarehouse.msn === "Sucursal sin Almacenes, contacte con soporte" ||
			getWarehouse.msn === "Sucursal con Almacenes Incompletos, contacte con soporte")) {
			return {
				status: false,
				msn: getWarehouse.msn,
				supervition: false
			};
		}

		if (!getWarehouse.status && (getWarehouse.msn === "No ha realizado sus supervisiones" ||
			getWarehouse.msn === "Supervisiones Incompletas")) {
			let messageWarehouse = `
                <div class="frappe-control form-group px-3" data-fieldtype="Table" data-fieldname="his_contratos" title="his_contratos">
                    <label for="exampleFormControlInput1" class="hidden-xs text-uppercase text-center font-weight-bold">
                        A su agencia le falta realizar la supervisión de almacén de las siguientes categorías:
                    </label>
                </div>
                <div class="frappe-control form-group p-4" data-fieldtype="Table" data-fieldname="his_contratos" title="his_contratos">
                    <div class="form-grid">
                        <div class="grid-heading-row">
                            <div class="grid-row">
                                <div class="data-row row">
                                    <div class="row-index sortable-handle col col-xs-2">
                                        <span class="hidden-xs text-uppercase text-center font-weight-bold">No.</span>
                                    </div>
                                    <div class="col grid-static-col col-xs-10" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
                                        <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Almacén</div>
                                    </div>
                                </div>
                            </div>
                            <div class="grid-body">
                                <div class="rows" v-for="attendance in arrayAttendance">
                                    <div class="spinner-border text-primary" role="status" id="loading_spinner" style="margin-left: 203px;margin-top: 10px; margin-bottom: 5px">
                                        <span class="visually-hidden"></span>
                                    </div>
                                    <div class="grid-row" data-name="3171919805" :data-idx="attendance.countr" id="table_supervision" style="display: none">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="frappe-control form-group p-4" data-fieldtype="Table" data-fieldname="his_contratos" title="his_contratos">
                    <div class="mb-1">
                        <div class="row">
                            <div class="col-6">
                                <button class="btn btn-primary btn-block" id="SendData" type="button" aria-haspopup="true" aria-expanded="false">
                                    Ver Tutorial
                                </button>
                            </div>
                            <div class="col-6">
                                <button class="btn btn-primary btn-block" id="SendData2" type="submit" aria-haspopup="true" aria-expanded="false">
                                    Ingresar al ERP
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

			return {
				status: false,
				msn: messageWarehouse,
				supervition: true,
				warehouse: getWarehouse.warehouses
			};
		}

		if (getWarehouse.status) {
			return {
				status: true,
				msn: getWarehouse.msn,
				supervition: false
			};
		}
	} catch (error) {
		// Manejo de errores en la solicitud AJAX o procesamiento
		console.error("Error en la función verifiedSupervition:", error);
		return {
			status: false,
			msn: "Hubo un error al verificar la supervisión. Por favor, intenta de nuevo más tarde.",
			supervition: false
		};
	}
};

const verifiedSupervitionStore = async (rolUser) => {
	try {
		const branch = rolUser[0].branch;
		const getWarehouse = await $.ajax({
			url: `https://recursoshumanos.shalom.com.pe/module/human/check-storage-supervisions/${branch}`,
			type: "GET",
		});

		if (!getWarehouse.status && (getWarehouse.msn === "No ha realizado sus supervisiones" || getWarehouse.msn === "Supervisiones Incompletas")) {
			let messageWarehouse = `
				<div class="frappe-control form-group px-3" data-fieldtype="Table" data-fieldname="his_contratos" title="his_contratos">
					<label for="exampleFormControlInput1" class="hidden-xs text-uppercase text-center font-weight-bold">
						A su agencia le falta realizar la supervisión de almacén de las siguientes categorías:
					</label>
				</div>
				<div class="frappe-control form-group p-4" data-fieldtype="Table" data-fieldname="his_contratos" title="his_contratos">
					<div class="form-grid">
						<div class="grid-heading-row">
							<div class="grid-row">
								<div class="data-row row">
									<div class="row-index sortable-handle col col-xs-2">
										<span class="hidden-xs text-uppercase text-center font-weight-bold">No.</span>
									</div>
									<div class="col grid-static-col col-xs-10" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
										<div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Almacén</div>
									</div>
								</div>
							</div>
							<div class="grid-body">
								<div class="rows" v-for="attendance in arrayAttendance">
									<div class="spinner-border text-primary" role="status" id="loading_spinner" style="margin-left: 203px;margin-top: 10px; margin-bottom: 5px">
										<span class="visually-hidden"></span>
									</div>
									<div class="grid-row" data-name="3171919805" :data-idx="attendance.countr" id="table_supervision" style="display: none">
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="frappe-control form-group p-4" data-fieldtype="Table" data-fieldname="his_contratos" title="his_contratos">
					<div class="mb-1">
						<div class="row">
							<div class="col-12">
								<button class="btn btn-primary btn-block" id="SendData2" type="submit" aria-haspopup="true" aria-expanded="false">
									Ingresar al ERP
								</button>
							</div>
						</div>
					</div>
				</div>
			`;

			return {
				status: false,
				msn: messageWarehouse,
				supervition: true,
				warehouse: getWarehouse.warehouses
			};
		}

		if (getWarehouse.status) {
			return {
				status: true,
				msn: getWarehouse.msn,
				supervition: false
			};
		}
	} catch (error) {
		console.error("Error en la función verifiedSupervitionStore:", error);
		return {
			status: false,
			msn: "Hubo un error al verificar la supervisión. Por favor, intenta de nuevo más tarde.",
			supervition: false
		};
	}
};

const attendanceCorrectionsTable = async (department) => {

	let getAttendace, getEmployeeNotReported, getEmployeeNotDownloadPayroll, getEmployeeNotDownloadContract, get_renewals;

	try {
		getAttendace = await $.ajax({
			url: "https://recursoshumanos.shalom.com.pe/api/get-employee-not-assistance/" + department,
			type: "GET",
		});
	} catch (error) {
		console.error('Error al obtener asistencia:', error);
		return {
			status: false,
			msn: "Error al obtener asistencia",
			validation: false
		}
	}

	try {
		getEmployeeNotReported = await $.ajax({
			url: "https://capacitacion.shalom.com.pe/api/method/erpnext.hr.doctype.attendance.api.getEmployeeNotReported?departamento="+department,
			type: "GET",
		})
	} catch (error) {
		console.error('Error al obtener asistencia:', error);
		return {
			status: false,
			msn: "Error al obtener empleados no reportados",
			validation: false
		}
	}

	try {
		getEmployeeNotDownloadPayroll = await $.ajax({
			url: "https://recursoshumanos.shalom.com.pe/module/human/check-payroll-download-status/"+department,
			type: "GET",
		})
	} catch (error) {
		console.error('Error al obtener asistencia:', error);
		return {
			status: false,
			msn: "Error al obtener lista de empleados que no han descargado su boleta",
			validation: false
		}
	}

	try {
		getEmployeeNotDownloadContract = await $.ajax({
			url: "https://recursoshumanos.shalom.com.pe/module/human/check-contract-download-status/"+department,
			type: "GET",
		})
	} catch (error) {
		console.error('Error al obtener asistencia:', error);
		return {
			status: false,
			msn: "Error al obtener lista de empleados que no han descargado su contrato",
			validation: false
		}
	}

	try {
		get_renewals = await $.ajax({
			url: "https://recursoshumanos.shalom.com.pe/module/human/approve-renewal-by-area/"+department,
			type: "GET",
		})
	} catch (error) {
		console.error('Error al obtener asistencia:', error);
		return {
			status: false,
			msn: "Error al obtener lista de renovaciones no validadas",
			validation: false
		}
	}

	if ( !get_renewals.status && getAttendace.length === 0 && getEmployeeNotReported.message.length === 0 && !getEmployeeNotDownloadPayroll.status && !getEmployeeNotDownloadContract.status ) {
		return {
			status: false,
			msn: "Sin observaciones",
			validation: true
		}
	}

	return {
		status: true,
		dataAttendance: getAttendace,
		dataNotReported: getEmployeeNotReported.message,
		dataEmployee: getEmployeeNotDownloadPayroll,
		dataEmployeeContract: getEmployeeNotDownloadContract,
		data_renewal: get_renewals,
		validation: true
	}

}

const attendanceCorrectionsTableHuachipa = async (branch) => {

	let getAttendace, getEmployeeNotReported, getEmployeeNotDownloadPayroll, getEmployeeNotDownloadContract, get_renewals;

	try {
		getAttendace = await $.ajax({
			url: "https://recursoshumanos.shalom.com.pe/api/get-employee-not-assistance-huachipa/"+branch,
			type: "GET",
		})
	} catch (error) {
		console.error('Error al obtener asistencia:', error);
		return {
			status: false,
			msn: "Error al obtener asistencia de huachipa",
			validation: false
		}
	}


	getEmployeeNotReported = []

	try {
		getEmployeeNotDownloadPayroll = await $.ajax({
			url: "https://recursoshumanos.shalom.com.pe/module/human/check-payroll-download-status-huachipa-co/"+branch,
			type: "GET",
		})

	} catch (error) {
		console.error('Error al obtener asistencia:', error);
		return {
			status: false,
			msn: "Error al obtener lista de empleados de huachipa que no descargaron su boleta",
			validation: false
		}
	}

	try {
		getEmployeeNotDownloadContract = await $.ajax({
			url: "https://recursoshumanos.shalom.com.pe/module/human/check-contract-download-status-huachipa-co/"+branch,
			type: "GET",
		})

	} catch (error) {
		console.error('Error al obtener asistencia:', error);
		return {
			status: false,
			msn: "Error al obtener lista de empleados de huachipa que no descargaron su contrato",
			validation: false
		}
	}


	try {
		get_renewals = await $.ajax({
			url: "https://recursoshumanos.shalom.com.pe/module/human/approve-renewal-by-area-huachipa-co/"+branch,
			type: "GET",
		})

	} catch (error) {
		console.error('Error al obtener asistencia:', error);
		return {
			status: false,
			msn: "Error al obtener lista de renovaciones no validadas de huachipa",
			validation: false
		}
	}


	if ( !get_renewals.status && getAttendace.length === 0 && getEmployeeNotReported.length === 0 && !getEmployeeNotDownloadPayroll.status && !getEmployeeNotDownloadContract.status ) {
		return {
			status: false,
			msn: "Sin observaciones",
			validation: true
		}
	}

	return {
		status: true,
		dataAttendance: getAttendace,
		dataNotReported: [],
		dataEmployee: getEmployeeNotDownloadPayroll,
		dataEmployeeContract: getEmployeeNotDownloadContract,
		data_renewal: get_renewals,
		validation: true
	}

}

const tableAttendance = async () => {

	let nombresMeses = [
		"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto",
		"Setiembre", "Octubre", "Noviembre", "Diciembre"
	];
	let fecha_actual = new Date();
	let numero_mes = fecha_actual.getMonth();
	let nombre_mes = nombresMeses[numero_mes];


	let tableCorrection = `
				<div class="page-head flex">
				  <div class="container">
					<div class="row flex align-center page-head-content justify-between">
					  <div class="p-2 flex col page-actions justify-content-end">
						<div class="standard-actions flex mt-2 mb-2">
						  <button class="btn btn-primary btn-md primary-action" data-label="Guardar" id="joinErp" style="display: none"><span class="alt-underline">I</span>ngresar al ERP
						  </button>
						  <div class="spinner-border text-primary" role="status" id="joinErpSpinner">
							<span class="visually-hidden"></span>
							</div>
						</div>
					  </div>
					</div>
				  </div>
				</div>
				<div class="frappe-control form-group px-3" id="title_renewal">
					<label for="exampleFormControlInput1" class="hidden-xs text-uppercase text-center font-weight-bold">
						Solicitudes de Renovación en Estado Borrador de ${nombre_mes}
					</label>
					<span class="hidden-xs text-uppercase text-center">
						RECUERDE QUE A PARTIR DEL DÍA 15 DEL MES NO PODRÁ INGRESAR SI NO CAMBIO EL ESTADO A SUS SOLICITUDES DE RENOVACION A "PENDIENTE DE VALIDAR" O "VALIDADO", En caso de que se bloquee el acceso, por favor comunícate con Recursos Humanos para resolverlo.
					</span>
				</div>
					<div class="frappe-control form-group p-4" id="table_renewal">
						<div class="form-grid">
						  <div class="grid-heading-row">
							<div class="grid-row">
							  <div class="data-row row">
								<div class="row-index sortable-handle col col-xs-1">
								  <span class="hidden-xs text-uppercase text-center font-weight-bold">No.</span>
								</div>
								<div class="col grid-static-col col-xs-3">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">ID Solicitud</div>
								</div>
								<div class="col grid-static-col col-xs-4">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Agencia</div>
								</div>
								<div class="col grid-static-col col-xs-4">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Departamento</div>
								</div>
							  </div>
							</div>
							<div class="grid-body">
								<div class="rows" v-for="attendance in arrayAttendance">
									<div class="spinner-border text-primary" role="status" id="loading_spinner_renewal" style="margin-left: 459px;margin-top: 10px; margin-bottom: 5px">
									  <span class="visually-hidden"></span>
									</div>
									<div class="grid-row" id="table_body_renewal" style="display: none">
									</div>
									<div id="renewal_empty" class="grid-empty text-center" style="display: none">
										<img src="https://capacitacion.shalom.com.pe/assets/frappe/images/ui-states/grid-empty-state.svg" alt="Grid Empty State" class="grid-empty-illustration">
										No hay datos
									</div>
								</div>
							</div>
						  </div>
						</div>
					</div>
  				</div>
				
				
				
				<div class="frappe-control form-group px-3" id="title_donwload_contract_id" data-fieldtype="Table" data-fieldname="title_donwload_contract">
					<label for="exampleFormControlInput1" class="hidden-xs text-uppercase text-center font-weight-bold">
						Empleados que no han descargado su contrato: 
					</label>
					<span class="hidden-xs text-uppercase text-center">
						RECUERDE QUE A PARTIR DEL DÍA 26 DEL MES NO PODRÁ INGRESAR SI SUS TRABAJADORES NO DESCARGAN SU NUEVO CONTRATO
					</span>
				</div>
				<div class="frappe-control form-group p-4" id="table_donwload_contract_id" data-fieldtype="Table" data-fieldname="table_donwload_contract" title="his_contratos">
    				<div class="form-grid">
						  <div class="grid-heading-row">
							<div class="grid-row">
							  <div class="data-row row">
								<div class="row-index sortable-handle col col-xs-1">
								  <span class="hidden-xs text-uppercase text-center font-weight-bold">No.</span>
								</div>
								<div class="col grid-static-col col-xs-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">ID EMPLEADO</div>
								</div>
								<div class="col grid-static-col col-xs-4" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Agencia</div>
								</div>
								<div class="col grid-static-col col-xs-4" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Nombre Completo</div>
								</div>
							  </div>
							</div>
							<div class="grid-body">
								<div class="rows" v-for="attendance in arrayAttendance">
									<div class="spinner-border text-primary" role="status" id="loading_spinner_download_contract" style="margin-left: 459px;margin-top: 10px; margin-bottom: 5px">
									  <span class="visually-hidden"></span>
									</div>
									<div class="grid-row" data-name="3171919805" :data-idx="attendance.countr" id="table_body_donwload_contract" style="display: none">
									</div>
									<div id="download_contract_empty" class="grid-empty text-center" style="display: none">
										<img src="https://capacitacion.shalom.com.pe/assets/frappe/images/ui-states/grid-empty-state.svg" alt="Grid Empty State" class="grid-empty-illustration">
										No hay datos
									</div>
								</div>
				  			</div>
						  </div>
    				</div>
  				</div>
  				</div>
  				<div class="frappe-control form-group px-3" data-fieldtype="Table" id="title_donwload_payroll" data-fieldname="title_donwload_payroll_fieldname">
					<label for="exampleFormControlInput1" class="hidden-xs text-uppercase text-center font-weight-bold">
						Empleados que no han descargado su boleta: 
					</label>
					<span class="hidden-xs text-uppercase text-center">
						RECUERDE QUE A PARTIR DEL DÍA 5 DEL MES,NO PODRÁ INGRESAR SI SUS TRABAJADORES NO DESCARGAN SU BOLETA A TRAVÉS DEL APLICATIVO SHALOM FAMILIA
					</span>
				</div>
				<div class="frappe-control form-group p-4" id="table_donwload_payroll_id" data-fieldtype="Table" data-fieldname="table_donwload_payroll" title="his_contratos">
    				<div class="form-grid">
						  <div class="grid-heading-row">
							<div class="grid-row">
							  <div class="data-row row">
								<div class="row-index sortable-handle col col-xs-1">
								  <span class="hidden-xs text-uppercase text-center font-weight-bold">No.</span>
								</div>
								<div class="col grid-static-col col-xs-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">ID EMPLEADO</div>
								</div>
								<div class="col grid-static-col col-xs-4" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Agencia</div>
								</div>
								<div class="col grid-static-col col-xs-4" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Nombre Completo</div>
								</div>
							  </div>
							</div>
							<div class="grid-body">
								<div class="rows" v-for="attendance in arrayAttendance">
									<div class="spinner-border text-primary" role="status" id="loading_spinner_download" style="margin-left: 459px;margin-top: 10px; margin-bottom: 5px">
									  <span class="visually-hidden"></span>
									</div>
									<div class="grid-row" data-name="3171919805" :data-idx="attendance.countr" id="table_body_donwload" style="display: none">
									</div>
									<div id="download_empty" class="grid-empty text-center" style="display: none">
										<img src="https://capacitacion.shalom.com.pe/assets/frappe/images/ui-states/grid-empty-state.svg" alt="Grid Empty State" class="grid-empty-illustration">
										No hay datos
									</div>
								</div>
				  			</div>
						  </div>
    				</div>
  				</div>
  				</div>
				<div class="frappe-control form-group px-3" id="label_table_assistance" data-fieldtype="Table" data-fieldname="his_contratos" title="his_contratos">
					<label for="exampleFormControlInput1" class="hidden-xs text-uppercase text-center font-weight-bold">
						Asistencias Incompletas: 
					</label>
					<span class="hidden-xs text-uppercase text-center">Debe corregir las asistencias de los trabajadore o de lo contrario
					no pódra ingresar</span>
				</div>
				<div class="frappe-control form-group p-4" id="general_table_assistance" data-fieldtype="Table" data-fieldname="his_contratos" title="his_contratos">
    				<div class="form-grid">
						  <div class="grid-heading-row">
							<div class="grid-row">
							  <div class="data-row row">
								<div class="row-index sortable-handle col col-xs-1">
								  <span class="hidden-xs text-uppercase text-center font-weight-bold">No.</span>
								</div>
								<div class="col grid-static-col col-xs-2" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Agencia</div>
								</div>
								<div class="col grid-static-col col-xs-2" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Fecha</div>
								</div>
								<div class="col grid-static-col col-xs-4" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Nombre Completo</div>
								</div>
								<div class="col grid-static-col col-xs-3" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Acciones</div>
								</div>
							  </div>
							</div>
							<div class="grid-body">
						<div class="rows" v-for="attendance in arrayAttendance">
							<div class="spinner-border text-primary" role="status" id="loading_spinner_attendance" style="margin-left: 459px;margin-top: 10px; margin-bottom: 5px">
							  <span class="visually-hidden"></span>
							</div>
							<div class="grid-row" data-name="3171919805" :data-idx="attendance.countr" id="table_attendance" style="display: none">
							</div>
							<div id="attendance_cero" class="grid-empty text-center" style="display: none">
								<img src="https://capacitacion.shalom.com.pe/assets/frappe/images/ui-states/grid-empty-state.svg" alt="Grid Empty State" class="grid-empty-illustration">
								No hay datos
							</div>
						</div>
				  	</div>
						  </div>
    				</div>
  				</div>
  				</div>
  				<div class="frappe-control form-group px-3" id="label_table_not_reported" data-fieldtype="Table" data-fieldname="his_contratos" title="his_contratos">
					<label for="exampleFormControlInput1" class="hidden-xs text-uppercase text-center font-weight-bold">
						Empleado No Reportados: 
					</label>
					<span class="hidden-xs text-uppercase text-center ">Debe indicar la situacion de los trabajadores.</span>
				</div>
  				<div class="frappe-control form-group p-4" id="general_table_not_reported" data-fieldtype="Table" data-fieldname="his_contratos" title="his_contratos">
    				<div class="form-grid">
						  <div class="grid-heading-row">
							<div class="grid-row">
							  <div class="data-row row">
								<div class="row-index sortable-handle col col-xs-2">
								  <span class="hidden-xs text-uppercase text-center font-weight-bold">No.</span>
								</div>
								<div class="col grid-static-col col-xs-5" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Agencia</div>
								</div>
								<div class="col grid-static-col col-xs-5" data-fieldname="tipo_de_servicio" data-fieldtype="Link" title="Tipo de Servicio">
								  <div class="field-area static-area ellipsis text-uppercase text-center font-weight-bold">Nombre Completo</div>
								</div>
							  </div>
							</div>
							<div class="grid-body">
						<div class="rows" v-for="attendance in arrayAttendance">
							<div class="spinner-border text-primary" role="status" id="loading_spinner_reported" style="margin-left: 459px;margin-top: 10px; margin-bottom: 5px">
							  <span class="visually-hidden"></span>
							</div>
							<div class="grid-row" data-name="3171919805" :data-idx="attendance.countr" id="table_not_reported" style="display: none">
							</div>
							<div id="reported_cero" class="grid-empty text-center" style="display: none">
								<img src="https://capacitacion.shalom.com.pe/assets/frappe/images/ui-states/grid-empty-state.svg" alt="Grid Empty State" class="grid-empty-illustration">
								No hay datos
							</div>
						</div>
				  	</div>
						  </div>
    				</div>
  				</div>
			`
	return tableCorrection
}

const viewUpdateEmployee = async () => {
	const tableUpdate = `<div class="content page-container editable-form mb-4" style="background: rgb(249, 250, 250)" id="view-employee-update" data-page-route="Employee Checkin" data-state="dirty">
    <div class="page-head flex">
      <div class="container">
        <div class="row flex align-center page-head-content justify-between">
          <div class="p-2 flex col page-actions justify-content-end">
            <div class="standard-actions flex mt-2 mb-2">
              <button class="btn btn-primary btn-md primary-action" data-label="Guardar" id="updateAttendaceWithService"><span
                  class="alt-underline">A</span>ctualizar
              </button>
              <div class="spinner-border text-primary" role="status" id="loading_update" style="display: none">
					<span class="visually-hidden"></span>
				</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="container page-body">
      <div class="page-wrapper">
        <div class="page-content">
          <div class="row layout-main">
            <div class="col">
              <div class="layout-main-section">
                <div class="form-layout">
                  <div class="form-page">
                    <div class="row form-section card-section visible-section">
                      <div class="section-body mb-3">
                        <div class="form-column col-sm-3">
                          <div class="frappe-control input-max-width" data-fieldtype="Data"
                               data-fieldname="IdEmpleado" title="correo">
                            <div class="form-group">
                              <div class="clearfix"><label class="control-label" style="padding-right: 0px;">ID Empleado</label>
                              </div>
                              <div class="control-input-wrapper">
                                <div class="control-input">
                                  <div class="link-field ui-front" style="position: relative;">
                                    <div class="awesomplete">
                                      <input type="text" class="input-with-feedback form-control" role="combobox" id="formName">
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="form-column col-sm-3">
                          <div class="frappe-control input-max-width" data-fieldtype="Data"
                               data-fieldname="nombreCompleto" title="correo">
                            <div class="form-group">
                              <div class="clearfix"><label class="control-label" style="padding-right: 0px;">Nombre Completo</label>
                              </div>
                              <div class="control-input-wrapper">
                                <div class="control-input">
                                  <div class="link-field ui-front" style="position: relative;">
                                    <div class="awesomplete">
                                      <input type="text" class="input-with-feedback form-control" role="combobox" id="formFullName">
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="form-column col-sm-3">
                          <div class="frappe-control input-max-width" data-fieldtype="Data"
                               data-fieldname="turno" title="correo">
                            <div class="form-group">
                              <div class="clearfix"><label class="control-label" style="padding-right: 0px;">Turno</label>
                              </div>
                              <div class="control-input-wrapper">
                                <div class="control-input">
                                  <div class="link-field ui-front" style="position: relative;">
                                    <div class="awesomplete">
                                      <input type="text" class="input-with-feedback form-control" role="combobox" id="formTurn">
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="form-column col-sm-3">
                          <div class="frappe-control input-max-width" data-fieldtype="Data"
                               data-fieldname="tipo_jornada" title="correo">
                            <div class="form-group">
                              <div class="clearfix"><label class="control-label" style="padding-right: 0px;">Tipo de Jornada</label>
                              </div>
                              <div class="control-input-wrapper">
                                <div class="control-input">
                                  <div class="link-field ui-front" style="position: relative;">
                                    <div class="awesomplete">
                                      <input type="text" class="input-with-feedback form-control" role="combobox" id="formJorn">
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div class="form-column col-sm-4"></div>
                        <div class="form-column col-sm-4">
                            <div class="frappe-control input-max-width has-error" data-fieldtype="datetime"
                                 data-fieldname="entradaField" title="email">
                              <div class="form-group">
                                <div class="clearfix"><label class="control-label text-center font-weight-bold" style="padding-right: 0px;">Entrada</label>
                                </div>
                                <div class="control-input-wrapper">
                                  <div class="control-input">
                                    <div class="link-field ui-front" style="position: relative;">
                                      <div class="awesomplete">
                                        <input type="time" class="input-with-feedback form-control" role="combobox" id="formMarcacionEntrada">
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        <div class="form-column col-sm-4"> </div>
                          
                        <div class="form-column col-sm-4"></div>
                        <div class="form-column col-sm-4">
                            <div class="frappe-control input-max-width has-error" data-fieldtype="datetime"
                                 data-fieldname="marcacionInicioAl" title="email">
                              <div class="form-group">
                                <div class="clearfix"><label class="control-label text-center font-weight-bold" style="padding-right: 0px;">Inicio Almuerzo</label>
                                </div>
                                <div class="control-input-wrapper">
                                  <div class="control-input">
                                    <div class="link-field ui-front" style="position: relative;">
                                      <div class="awesomplete">
                                        <input type="time" class="input-with-feedback form-control" role="combobox" id="formMarcacionInicioAl">
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        <div class="form-column col-sm-4"></div>
                        
                        <div class="form-column col-sm-4"></div>  
                        <div class="form-column col-sm-4">
                            <div class="frappe-control input-max-width has-error" data-fieldtype="datetime"
                                 data-fieldname="marcacionFinAl" title="email">
                              <div class="form-group">
                                <div class="clearfix"><label class="control-label text-center font-weight-bold" style="padding-right: 0px;">Fin de Almuerzo</label>
                                </div>
                                <div class="control-input-wrapper">
                                  <div class="control-input">
                                    <div class="link-field ui-front" style="position: relative;">
                                      <div class="awesomplete">
                                        <input type="time" class="input-with-feedback form-control" role="combobox" id="formMarcacionFinAl">
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        <div class="form-column col-sm-4"></div>
                        
                        <div class="form-column col-sm-4"></div>  
                        <div class="form-column col-sm-4">
                            <div class="frappe-control input-max-width has-error" data-fieldtype="datetime"
                                 data-fieldname="salidaField" title="email">
                              <div class="form-group">
                                <div class="clearfix"><label class="control-label text-center font-weight-bold" style="padding-right: 0px;">Salida</label>
                                </div>
                                <div class="control-input-wrapper">
                                  <div class="control-input">
                                    <div class="link-field ui-front" style="position: relative;">
                                      <div class="awesomplete">
                                        <input type="time" class="input-with-feedback form-control" role="combobox" id="formMarcacionSalida">
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        <div class="form-column col-sm-4"></div>  
                          
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`
	return tableUpdate
}

const updateEmployeeAttendance = async (employeeName, date) => {

	const getAttendance = await $.ajax({
		url: `https://capacitacion.shalom.com.pe/api/method/erpnext.hr.doctype.attendance.api.getAttendanceRecords?employee=${employeeName}&&date=${date}`,
		type: "GET",
	})

	return getAttendance.message

}

// Login
login.call = async function (args, callback) {
	login.set_status('{{ _("Verifying...") }}', 'blue');

	let users_permission;
	let rolUser;

	try {
		users_permission = await $.ajax({
			url: "https://capacitacion.shalom.com.pe/api/method/erpnext.hr.doctype.attendance.api.getAreaManagerData",
			type: "GET",
		});
	} catch (error) {
		console.error("Error al obtener permisos de usuario:", error);
		frappe.msgprint("Hubo un problema al obtener los permisos de usuario. Por favor, intenta de nuevo más tarde.")
		return false;
	}

	try {
		rolUser = await $.ajax({
			url: "https://capacitacion.shalom.com.pe/api/method/erpnext.hr.doctype.attendance.api.getRoles?user="+args.usr,
			type: "GET",
		})
	} catch (error) {
		console.error("Error al obtener permisos de usuario:", error);
		frappe.msgprint("Hubo un problema al obtener los roles de usuario. Por favor, intenta de nuevo más tarde.")
		return false;
	}

	/** ALERTA ACTIVADA */
	if ( users_permission.message[args.usr] != undefined || args.usr === "74875962@shalomcontrol.com" || args.usr === "41333025@shalomcontrol.com" ) {

		let attendanceCorrections = {};
		if (users_permission.message[args.usr] != undefined) {
			attendanceCorrections = await attendanceCorrectionsTable(users_permission.message[args.usr])
		} else {
			attendanceCorrections = await attendanceCorrectionsTableHuachipa("HUACHIPA CO")
		}

		if (!attendanceCorrections.validation) {
			frappe.msgprint(attendanceCorrections.msn)
			return false;
		}

		console.log(attendanceCorrections, 'attendanceCorrections')

		let table = await tableAttendance()

		frappe.msgprint({
			title: "Alerta",
			message: table,
			indicator: "red",
		});

		setTimeout(()=>{
			document.getElementsByClassName('msgprint-dialog')[0].style.maxWidth = "1020px"
		},800)

		console.log(attendanceCorrections.status, 'asd')

		if ( attendanceCorrections.status ) {

			setTimeout(()=>{

				let buttonJoinErp = document.getElementById('joinErp')
				let joinErpSpinner = document.getElementById('joinErpSpinner')

				console.log(buttonJoinErp, 'buttonJoinErp')
				console.log(joinErpSpinner, 'joinErpSpinner')

				buttonJoinErp.disabled = true

				let tableAttedance = document.getElementById('general_table_assistance')
				let labelAttedance = document.getElementById('label_table_assistance')
				let tableNotReported = document.getElementById('general_table_not_reported')
				let labelNotReported = document.getElementById('label_table_not_reported')
				let labelNotDownloadPayroll = document.getElementById('title_donwload_payroll')
				let tableNotDownloadPayroll = document.getElementById('table_donwload_payroll_id')
				let labelNotDownloadContract = document.getElementById('title_donwload_contract_id')
				let tableNotDownloadContract = document.getElementById('table_donwload_contract_id')

				let table_renewal = document.getElementById('table_renewal');
				let label_renewal = document.getElementById('title_renewal');

				table_renewal.style.opacity = 1;
				table_renewal.style.transition = 'opacity 2.5s';

				tableAttedance.style.opacity = 1
				tableAttedance.style.transition = 'opacity 2.5s'

				labelAttedance.style.opacity = 1
				labelAttedance.style.transition = 'opacity 2.5s'

				tableNotReported.style.opacity = 1
				tableNotReported.style.transition = 'opacity 2.5s'

				labelNotReported.style.opacity = 1
				labelNotReported.style.transition = 'opacity 2.5s'

				labelNotDownloadPayroll.style.opacity = 1
				labelNotDownloadPayroll.style.transition = 'opacity 2.5s'

				tableNotDownloadPayroll.style.opacity = 1
				tableNotDownloadPayroll.style.transition = 'opacity 2.5s'

				labelNotDownloadContract.style.opacity = 1
				labelNotDownloadContract.style.transition = 'opacity 2.5s'

				tableNotDownloadContract.style.opacity = 1
				tableNotDownloadContract.style.transition = 'opacity 2.5s'

				if (attendanceCorrections.data_renewal.renewals.length) {
					let table_renewal = document.getElementById('table_body_renewal');
					let loading_spinner = document.getElementById('loading_spinner_renewal');
					let array_renewals = attendanceCorrections.data_renewal.renewals;
					let count_renewal = 1;

					for (const renewal of array_renewals) {

						let divParent = document.createElement('div')
						divParent.classList.add('data-row', 'row')

						let divChildrenOne = document.createElement('div')
						divChildrenOne.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-1');
						let spanOne = document.createElement('span')
						spanOne.classList.add('hidden-xs', 'text-center', 'font-weight-bold');
						spanOne.innerHTML = count_renewal
						count_renewal++

						let divChildrenTwo = document.createElement('div')
						divChildrenTwo.classList.add('col', 'grid-static-col', 'col-xs-3', 'text-center');
						let spanTwo = document.createElement('span')
						spanTwo.classList.add('field-area', 'static-area', 'ellipsis');
						spanTwo.innerHTML = renewal.name

						let divChildrenThree = document.createElement('div')
						divChildrenThree.classList.add('col', 'grid-static-col', 'col-xs-4', 'text-center');
						let spanThree = document.createElement('span')
						spanThree.classList.add('field-area', 'static-area', 'ellipsis');
						spanThree.innerHTML = renewal.sucursal

						let divChildrenFour = document.createElement('div')
						divChildrenFour.classList.add('col', 'grid-static-col', 'col-xs-4', 'text-center');
						let spanFour = document.createElement('span')
						spanFour.classList.add('field-area', 'static-area', 'ellipsis');
						spanFour.innerHTML = renewal.departamento

						divChildrenOne.appendChild(spanOne)
						divChildrenTwo.appendChild(spanTwo)
						divChildrenThree.appendChild(spanThree)
						divChildrenFour.appendChild(spanFour)

						divParent.appendChild(divChildrenOne)
						divParent.appendChild(divChildrenTwo)
						divParent.appendChild(divChildrenThree)
						divParent.appendChild(divChildrenFour)

						table_renewal.appendChild(divParent);

					}

					$('#loading_spinner_renewal').hide();
					$('#table_body_renewal').show();

					console.log(table_renewal,loading_spinner, array_renewals, count_renewal)
				} else {
					$('#loading_spinner_renewal').hide();
					$('#renewal_empty').show();

					table_renewal.style.opacity = 0;
					label_renewal.style.opacity = 0;

					setTimeout(function () {
						table_renewal.style.display = "none";
						label_renewal.style.display = "none";
					}, 2000)
				}

				if ( attendanceCorrections.dataAttendance.length ) {

					let table_attendance = document.getElementById('table_attendance')
					let loadingSpinner = document.getElementById('loading_spinner_attendance')
					let arrayAttendance = attendanceCorrections.dataAttendance
					let counta = 1

					for( const attendance of arrayAttendance ) {

						console.log(attendance, 'attendance')

						let divParent = document.createElement('div')
						divParent.classList.add('data-row', 'row')
						divParent.id = attendance.name + '-fila'

						let divChildrenOne = document.createElement('div')
						divChildrenOne.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-1');
						let spanOne = document.createElement('span')
						spanOne.classList.add('hidden-xs', 'text-center', 'font-weight-bold');
						spanOne.innerHTML = counta
						counta++

						let divChildrenTwo = document.createElement('div')
						divChildrenTwo.classList.add('col', 'grid-static-col', 'col-xs-2', 'text-center');
						let spanTwo = document.createElement('span')
						spanTwo.classList.add('field-area', 'static-area', 'ellipsis');
						spanTwo.innerHTML = attendance.branch

						let divChildrenThree = document.createElement('div')
						divChildrenThree.classList.add('col', 'grid-static-col', 'col-xs-2', 'text-center');
						let spanThree = document.createElement('span')
						spanThree.classList.add('field-area', 'static-area', 'ellipsis');
						spanThree.innerHTML = attendance.date_correction

						let divChildrenFour = document.createElement('div')
						divChildrenFour.classList.add('col', 'grid-static-col', 'col-xs-4', 'text-center');
						let spanFour = document.createElement('span')
						spanFour.classList.add('field-area', 'static-area', 'ellipsis');
						spanFour.innerHTML = attendance.nombre_completo

						let divChildrenFive = document.createElement('div')
						divChildrenFive.classList.add('col', 'grid-static-col', 'col-xs-3', 'text-center');
						divChildrenFive.style.padding = '1px'
						let buttonOne = document.createElement('button')
						buttonOne.classList.add('field-area', 'static-area', 'ellipsis', 'btn', 'btn-primary', 'btn-xl', 'primary-action');
						buttonOne.innerText = 'PRESENTE'
						buttonOne.id = attendance.name + '-present-' + attendance.date_correction
						buttonOne.dataset.attendance = attendance.date_correction
						buttonOne.dataset.type = "Presente"
						buttonOne.dataset.employee = attendance.name
						buttonOne.dataset.jornada = attendance.tipo_de_jornada
						buttonOne.dataset.tipoEmpleo = attendance.employment_type

						let buttonTwo = document.createElement('button')
						buttonTwo.classList.add('field-area', 'static-area', 'ellipsis', 'btn', 'btn-danger', 'btn-xl', 'primary-action');
						buttonTwo.innerText = 'AUSENTE'
						buttonTwo.style.marginLeft = '5px'
						buttonTwo.id = attendance.name + '-absent-' + attendance.date_correction
						buttonTwo.dataset.attendance = attendance.date_correction
						buttonTwo.dataset.type = "Ausente"
						buttonTwo.dataset.employee = attendance.name

						let loadingDiv = document.createElement('div')
						loadingDiv.classList.add('spinner-border','text-danger');
						loadingDiv.style.display = 'none'
						loadingDiv.id = 'loading-'+attendance.name + '-' + attendance.date_correction
						let loadingSpan = document.createElement('span')
						loadingSpan.classList.add('visually-hidden');
						loadingDiv.appendChild(loadingSpan)


						buttonOne.onclick = async  function( e ) {
							let tableGeneralAttendance = document.getElementById('general_table_assistance')
							let viewUpdate = await viewUpdateEmployee()

							let a = document.createElement('div')
							a.innerHTML = viewUpdate

							tableGeneralAttendance.parentNode.insertBefore(a, tableGeneralAttendance.nextSibling);
							tableGeneralAttendance.style.display = 'none'

							// FORM DE DATOS
							let formName = document.getElementById('formName')
							let formFullName = document.getElementById('formFullName')
							let formTurn = document.getElementById('formTurn')
							let formJorn = document.getElementById('formJorn')

							//FORM DE MARCACIONES
							let formMarcacionEntrada = document.getElementById('formMarcacionEntrada')
							let formMarcacionInicioAl = document.getElementById('formMarcacionInicioAl')
							let formMarcacionFinAl = document.getElementById('formMarcacionFinAl')
							let formMarcacionSalida = document.getElementById('formMarcacionSalida')

							formName.value = attendance.name
							formName.disabled = true
							formFullName.value = attendance.nombre_completo
							formFullName.disabled = true
							formTurn.value = attendance.employment_type
							formTurn.disabled = true
							formJorn.value = attendance.tipo_de_jornada
							formJorn.disabled = true

							var fecha = attendance.date_correction;
							var fechaObj = new Date(fecha);
							var numeroDiaSemana = fechaObj.getDay();

							//TRAER MARCACION SI ES QUE TIENE :v
							let getAttendanceExist = await updateEmployeeAttendance(attendance.name, attendance.date_correction)

							if ( attendance.employment_type == "Tiempo parcial" ) {

								let divMarcacionInicioAlmuerzo = $(`div[data-fieldname="marcacionInicioAl"]`);
								let divMarcacionFinAlmuerzo = $(`div[data-fieldname="marcacionFinAl"]`);

								divMarcacionInicioAlmuerzo.hide()
								divMarcacionFinAlmuerzo.hide()

								if ( getAttendanceExist.status ) {
									for ( let attendance of getAttendanceExist.msn ) {
										if ( attendance.log_type == "Entrada" ) {
											let dateTimeParts = attendance.time.split(' ');
											let timePart = dateTimeParts[1].split(':');
											let hour = timePart[0];
											let minutes = timePart[1];
											formMarcacionEntrada.value = `${hour}:${minutes}`
											if ( args.usr !== "45302955@shalomcontrol.com" ) {
												formMarcacionEntrada.disabled = true
												$(`div[data-fieldname="entradaField"]`).removeClass('has-error');
											}
										} else if ( attendance.log_type == "Salida" ) {
											let dateTimeParts = attendance.time.split(' ');
											let timePart = dateTimeParts[1].split(':');
											let hour = timePart[0];
											let minutes = timePart[1];
											formMarcacionSalida.value = `${hour}:${minutes}`
											if ( args.usr !== "45302955@shalomcontrol.com" ) {
												formMarcacionSalida.disabled = true
												$(`div[data-fieldname="salidaField"]`).removeClass('has-error');
											}
										} else {
											continue;
										}
									}
								}

							} else if (attendance.employment_type == "Jornada completa" && numeroDiaSemana == 5) {

								console.log(numeroDiaSemana, 'numeroDiaSemana')
								$(`div[data-fieldname="marcacionInicioAl"]`).removeClass('has-error');
								$(`div[data-fieldname="marcacionFinAl"]`).removeClass('has-error');

								if ( getAttendanceExist.status ) {
									for ( let attendance of getAttendanceExist.msn ) {
										if ( attendance.log_type == "Entrada" ) {
											let dateTimeParts = attendance.time.split(' ');
											let timePart = dateTimeParts[1].split(':');
											let hour = timePart[0];
											let minutes = timePart[1];
											formMarcacionEntrada.value = `${hour}:${minutes}`
											if ( args.usr !== "45302955@shalomcontrol.com" ) {
												formMarcacionEntrada.disabled = true
												$(`div[data-fieldname="entradaField"]`).removeClass('has-error');
											}
										} else if ( attendance.log_type == "Salida Refrigerio" ) {
											let dateTimeParts = attendance.time.split(' ');
											let timePart = dateTimeParts[1].split(':');
											let hour = timePart[0];
											let minutes = timePart[1];
											formMarcacionInicioAl.value = `${hour}:${minutes}`
											if ( args.usr !== "45302955@shalomcontrol.com" ) {
												formMarcacionInicioAl.disabled = true
												$(`div[data-fieldname="marcacionInicioAl"]`).removeClass('has-error');
											}
										} else if ( attendance.log_type == "Llegada Refrigerio" ) {
											let dateTimeParts = attendance.time.split(' ');
											let timePart = dateTimeParts[1].split(':');
											let hour = timePart[0];
											let minutes = timePart[1];
											formMarcacionFinAl.value = `${hour}:${minutes}`
											if ( args.usr !== "45302955@shalomcontrol.com" ) {
												formMarcacionFinAl.disabled = true
												$(`div[data-fieldname="marcacionFinAl"]`).removeClass('has-error');
											}
										} else if ( attendance.log_type == "Salida" ) {
											let dateTimeParts = attendance.time.split(' ');
											let timePart = dateTimeParts[1].split(':');
											let hour = timePart[0];
											let minutes = timePart[1];
											formMarcacionSalida.value = `${hour}:${minutes}`
											if ( args.usr !== "45302955@shalomcontrol.com" ) {
												formMarcacionSalida.disabled = true
												$(`div[data-fieldname="salidaField"]`).removeClass('has-error');
											}
										}
									}
								}
							} else {

								if ( getAttendanceExist.status ) {
									for ( let attendance of getAttendanceExist.msn ) {
										if ( attendance.log_type == "Entrada" ) {
											let dateTimeParts = attendance.time.split(' ');
											let timePart = dateTimeParts[1].split(':');
											let hour = timePart[0];
											let minutes = timePart[1];
											formMarcacionEntrada.value = `${hour}:${minutes}`
											if ( args.usr !== "45302955@shalomcontrol.com" ) {
												formMarcacionEntrada.disabled = true
												$(`div[data-fieldname="entradaField"]`).removeClass('has-error');
											}
										} else if ( attendance.log_type == "Salida Refrigerio" ) {
											let dateTimeParts = attendance.time.split(' ');
											let timePart = dateTimeParts[1].split(':');
											let hour = timePart[0];
											let minutes = timePart[1];
											formMarcacionInicioAl.value = `${hour}:${minutes}`
											if ( args.usr !== "45302955@shalomcontrol.com" ) {
												formMarcacionInicioAl.disabled = true
												$(`div[data-fieldname="marcacionInicioAl"]`).removeClass('has-error');
											}
										} else if ( attendance.log_type == "Llegada Refrigerio" ) {
											let dateTimeParts = attendance.time.split(' ');
											let timePart = dateTimeParts[1].split(':');
											let hour = timePart[0];
											let minutes = timePart[1];
											formMarcacionFinAl.value = `${hour}:${minutes}`
											if ( args.usr !== "45302955@shalomcontrol.com" ) {
												formMarcacionFinAl.disabled = true
												$(`div[data-fieldname="marcacionFinAl"]`).removeClass('has-error');
											}
										} else if ( attendance.log_type == "Salida" ) {
											let dateTimeParts = attendance.time.split(' ');
											let timePart = dateTimeParts[1].split(':');
											let hour = timePart[0];
											let minutes = timePart[1];
											formMarcacionSalida.value = `${hour}:${minutes}`
											if ( args.usr !== "45302955@shalomcontrol.com" ) {
												formMarcacionSalida.disabled = true
												$(`div[data-fieldname="salidaField"]`).removeClass('has-error');
											}
										}
									}
								}
							}

							$('#updateAttendaceWithService').on('click',async function() {
								let loading_update = document.getElementById('loading_update')
								let updateAttendaceWithService = document.getElementById('updateAttendaceWithService')

								if ( formJorn.value === "Nocturno" ) {

									let horaEntrada = formMarcacionEntrada.value
									let horaInicioAlmuerzo = formMarcacionInicioAl.value
									let horaFinAlmuerzo = formMarcacionFinAl.value
									let horaSalida = formMarcacionSalida.value

									if ( !horaEntrada ) {
										alert('Debe seleccionar la Hora de Entrada')
										return false
									}

									if ( !horaInicioAlmuerzo ) {
										alert('Debe seleccionar la Hora de Inicio de Almuerzo')
										return false
									}

									if ( !horaFinAlmuerzo ) {
										alert('Debe seleccionar la Hora de Fin de Almuerzo')
										return false
									}

									if ( !horaSalida ) {
										alert('Debe seleccionar la Hora de Salida')
										return false
									}

									loading_update.style.display = 'block'
									updateAttendaceWithService.style.display = 'none'

									let dataSend = {
										"entrada": horaEntrada,
										"entradaAlmuerzo": horaInicioAlmuerzo,
										"salidaAlmuerzo": horaFinAlmuerzo,
										"salida": horaSalida,
										"fecha": attendance.date_correction,
										"jornada": attendance.tipo_de_jornada,
										"tipoEmpleo": attendance.employment_type,
										"nameEmployee": attendance.name
									}

									try {
										let updateChekings = await $.ajax({
											type: "POST",
											url: 'https://recursoshumanos.shalom.com.pe/module/human/assistance-correction-from-login',
											dataType: "JSON",
											data: {
												"dataForm": dataSend
											}
										});

										if (!updateChekings.status) {
											loading_update.style.display = 'none';
											updateAttendaceWithService.style.display = 'block';
											alert(updateChekings.msn);
											return false;
										}

									} catch (error) {
										console.error('Error al actualizar los cheques:', error);
										loading_update.style.display = 'none';
										updateAttendaceWithService.style.display = 'block';
										alert('Ocurrió un error al intentar actualizar la asistencia.');
										return false;
									}

									setTimeout(()=>{
										let viewEmployeeUpdate = document.getElementById('view-employee-update')
										viewEmployeeUpdate.style.display = 'none'

										let tableGeneralAttendance = document.getElementById('general_table_assistance')
										tableGeneralAttendance.style.display = 'block'
									},1000)

									let getFila = document.getElementById(`${e.target.dataset.employee}-fila`)
									let tableAttendance = document.getElementById('table_attendance').childNodes;

									let saveDivOnRow = []
									let divOnRow = document.getElementById('table_attendance').childNodes;

									for (let div of divOnRow) {
										if (div.childNodes.length) {
											saveDivOnRow.push(div);
										}
									}

									let tamanoTabla = saveDivOnRow.length

									setTimeout( async ()=>{
										getFila.remove()
										tamanoTabla--

										if ( tamanoTabla == 0 ) {

											$('#attendance_cero').show();

											// VERIFICANDO SI LA TABLA REPORTADOS ESTA VACIA
											let saveDivOnRowReported = []
											let divOnRowReported = document.getElementById('table_not_reported').childNodes;

											for (let divReported of divOnRowReported) {
												if (divReported.childNodes.length) {
													saveDivOnRowReported.push(divReported);
												}
											}

											let tamanoTablaReported = saveDivOnRowReported.length


											// VERIFICANDO SI LA TABLA CONTRATOS ESTA VACIA
											let saveDivOnRowContract = []
											let divOnRowContract = document.getElementById('table_body_donwload_contract').childNodes;

											for (let divContract of divOnRowContract) {
												if (divContract.childNodes.length) {
													saveDivOnRowContract.push(divContract);
												}
											}

											let tamanoTablaContract = saveDivOnRowContract.length

											// VERIFICANDO SI LA TABLA BOLETAS ESTA VACIA
											let saveDivOnRowPayroll = []
											let divOnRowPayroll = document.getElementById('table_body_donwload').childNodes;

											for (let divPayroll of divOnRowPayroll) {
												if (divPayroll.childNodes.length) {
													saveDivOnRowPayroll.push(divPayroll);
												}
											}

											let tamanoTablaPayroll = saveDivOnRowPayroll.length

											let attendanceCorrections2 = await attendanceCorrectionsTable(users_permission.message[args.usr])

											if ( attendanceCorrections2.dataAttendance.length !== 0 ) {
												alert('Tiene asistencias pendientes de corregir')
												return false
											}

											if ( attendanceCorrections2.dataEmployee.employees.length !== 0 && attendanceCorrections2.dataEmployee.restriction ) {
												alert('Sus trabajadores aun no han descargado sus boletas de pago')
												return false
											}

											if ( attendanceCorrections2.dataEmployeeContract.employees.length !== 0 && attendanceCorrections2.dataEmployeeContract.restriction ) {
												alert('Sus trabajadores aun no han descargado sus contratos')
												return false
											}

											if ( attendanceCorrections2.dataNotReported.length !== 0 ) {
												alert('Tiene empleados no reportados, comuniquese con recursos humanos')
												return false
											}

											if ( attendanceCorrections.dataEmployee.status || attendanceCorrections.dataEmployeeContract.status ) {
												if ( attendanceCorrections.dataEmployee.restriction || attendanceCorrections.dataEmployeeContract.restriction ) {
													if (tamanoTablaReported == 0 && tamanoTablaContract == 0 && tamanoTablaPayroll == 0) {
														return frappe.call({
															type: "POST",
															args: args,
															callback: callback,
															freeze: true,
															statusCode: login.login_handlers
														});
													}
												} else {
													if (tamanoTablaReported == 0) {
														return frappe.call({
															type: "POST",
															args: args,
															callback: callback,
															freeze: true,
															statusCode: login.login_handlers
														});
													}
												}
											} else {
												if (tamanoTablaReported == 0) {
													return frappe.call({
														type: "POST",
														args: args,
														callback: callback,
														freeze: true,
														statusCode: login.login_handlers
													});
												}
											}

										}

									},1000)

								} else if ( formTurn.value === "Jornada completa" ) {

									let horaEntrada = formMarcacionEntrada.value
									let horaInicioAlmuerzo = formMarcacionInicioAl.value
									let horaFinAlmuerzo = formMarcacionFinAl.value
									let horaSalida = formMarcacionSalida.value

									if ( !horaEntrada ) {
										alert('Debe seleccionar la Hora de Entrada')
										return false
									}

									if ( !horaInicioAlmuerzo && numeroDiaSemana !== 5) {
										alert('Debe seleccionar la Hora de Inicio de Almuerzo')
										return false
									}

									if ( !horaFinAlmuerzo && numeroDiaSemana !== 5 ) {
										alert('Debe seleccionar la Hora de Fin de Almuerzo')
										return false
									}

									if ( !horaSalida ) {
										alert('Debe seleccionar la Hora de Salida')
										return false
									}

									loading_update.style.display = 'block'
									updateAttendaceWithService.style.display = 'none'

									let dataSend = {
										"entrada": horaEntrada,
										"entradaAlmuerzo": horaInicioAlmuerzo,
										"salidaAlmuerzo": horaFinAlmuerzo,
										"salida": horaSalida,
										"fecha": attendance.date_correction,
										"jornada": attendance.tipo_de_jornada,
										"tipoEmpleo": attendance.employment_type,
										"nameEmployee": attendance.name
									}

									try {
										let updateChekings = await $.ajax({
											type: "POST",
											url: 'https://recursoshumanos.shalom.com.pe/module/human/assistance-correction-from-login',
											dataType: "JSON",
											data: {
												"dataForm": dataSend
											}
										});

										if (!updateChekings.status) {
											loading_update.style.display = 'none';
											updateAttendaceWithService.style.display = 'block';
											alert(updateChekings.msn);
											return false;
										}

									} catch (error) {
										console.error('Error al actualizar los cheques:', error);
										loading_update.style.display = 'none';
										updateAttendaceWithService.style.display = 'block';
										alert('Ocurrió un error al intentar actualizar los cheques.');
										return false;
									}


									setTimeout(()=>{
										let viewEmployeeUpdate = document.getElementById('view-employee-update')
										viewEmployeeUpdate.style.display = 'none'

										let tableGeneralAttendance = document.getElementById('general_table_assistance')
										tableGeneralAttendance.style.display = 'block'
									},1000)

									let getFila = document.getElementById(`${e.target.dataset.employee}-fila`)
									let tableAttendance = document.getElementById('table_attendance').childNodes;

									let saveDivOnRow = []
									let divOnRow = document.getElementById('table_attendance').childNodes;

									for (let div of divOnRow) {
										if (div.childNodes.length) {
											saveDivOnRow.push(div);
										}
									}

									let tamanoTabla = saveDivOnRow.length

									setTimeout( async ()=>{
										getFila.remove()
										tamanoTabla--

										if ( tamanoTabla == 0 ) {

											$('#attendance_cero').show();

											let saveDivOnRowReported = []
											let divOnRowReported = document.getElementById('table_not_reported').childNodes;

											for (let divReported of divOnRowReported) {
												if (divReported.childNodes.length) {
													saveDivOnRowReported.push(divReported);
												}
											}

											let tamanoTablaReported = saveDivOnRowReported.length

											let attendanceCorrections2 = await attendanceCorrectionsTable(users_permission.message[args.usr])

											if ( attendanceCorrections2.dataAttendance.length !== 0 ) {
												alert('Tiene asistencias pendientes de corregir')
												return false
											}

											if ( attendanceCorrections2.dataEmployee.employees.length !== 0 && attendanceCorrections2.dataEmployee.restriction ) {
												alert('Sus trabajadores aun no han descargado sus boletas de pago')
												return false
											}

											if ( attendanceCorrections2.dataEmployeeContract.employees.length !== 0 && attendanceCorrections2.dataEmployeeContract.restriction ) {
												alert('Sus trabajadores aun no han descargado sus contratos')
												return false
											}

											if ( attendanceCorrections2.dataNotReported.length !== 0 ) {
												alert('Tiene empleados no reportados, comuniquese con recursos humanos')
												return false
											}

											if (tamanoTablaReported == 0) {
												return frappe.call({
													type: "POST",
													args: args,
													callback: callback,
													freeze: true,
													statusCode: login.login_handlers
												});
											}

										}

									},1000)


								} else if ( formTurn.value === "Tiempo parcial" ) {

									let horaEntrada = formMarcacionEntrada.value
									let horaSalida = formMarcacionSalida.value

									if ( !horaEntrada ) {
										alert('Debe seleccionar la Hora de Entrada')
										return false
									}

									if ( !horaSalida ) {
										alert('Debe seleccionar la Hora de Salida')
										return false
									}

									loading_update.style.display = 'block'
									updateAttendaceWithService.style.display = 'none'
									let dataSend = {
										"entrada": horaEntrada,
										"entradaAlmuerzo": "00:00",
										"salidaAlmuerzo": "00:00",
										"salida": horaSalida,
										"fecha": attendance.date_correction,
										"jornada": attendance.tipo_de_jornada,
										"tipoEmpleo": attendance.employment_type,
										"nameEmployee": attendance.name
									}


									let updateChekings = await $.ajax({
										type:"POST",
										url:' https://recursoshumanos.shalom.com.pe/module/human/assistance-correction-from-login',
										dataType:"JSON",
										data: {
											"dataForm": dataSend
										}
									});

									if ( !updateChekings.status ) {
										loading_update.style.display = 'none'
										updateAttendaceWithService.style.display = 'block'
										alert(updateChekings.msn)
										return false
									}

									setTimeout(()=>{
										let viewEmployeeUpdate = document.getElementById('view-employee-update')
										viewEmployeeUpdate.style.display = 'none'

										let tableGeneralAttendance = document.getElementById('general_table_assistance')
										tableGeneralAttendance.style.display = 'block'
									},1000)

									let getFila = document.getElementById(`${e.target.dataset.employee}-fila`)
									let tableAttendance = document.getElementById('table_attendance').childNodes;

									let saveDivOnRow = []
									let divOnRow = document.getElementById('table_attendance').childNodes;

									for (let div of divOnRow) {
										if (div.childNodes.length) {
											saveDivOnRow.push(div);
										}
									}

									let tamanoTabla = saveDivOnRow.length

									setTimeout( async ()=>{
										getFila.remove()
										tamanoTabla--

										if ( tamanoTabla == 0 ) {

											$('#attendance_cero').show();

											let saveDivOnRowReported = []
											let divOnRowReported = document.getElementById('table_not_reported').childNodes;

											for (let divReported of divOnRowReported) {
												if (divReported.childNodes.length) {
													saveDivOnRowReported.push(divReported);
												}
											}

											let tamanoTablaReported = saveDivOnRowReported.length

											let attendanceCorrections2 = await attendanceCorrectionsTable(users_permission.message[args.usr])

											if ( attendanceCorrections2.dataAttendance.length !== 0 ) {
												alert('Tiene asistencias pendientes de corregir')
												return false
											}

											if ( attendanceCorrections2.dataEmployee.employees.length !== 0 && attendanceCorrections2.dataEmployee.restriction ) {
												alert('Sus trabajadores aun no han descargado sus boletas de pago')
												return false
											}

											if ( attendanceCorrections2.dataEmployeeContract.employees.length !== 0 && attendanceCorrections2.dataEmployeeContract.restriction ) {
												alert('Sus trabajadores aun no han descargado sus contratos')
												return false
											}

											if ( attendanceCorrections2.dataNotReported.length !== 0 ) {
												alert('Tiene empleados no reportados, comuniquese con recursos humanos')
												return false
											}

											if (tamanoTablaReported == 0) {
												return frappe.call({
													type: "POST",
													args: args,
													callback: callback,
													freeze: true,
													statusCode: login.login_handlers
												});
											}

										}

									},1000)

								}


							});


						}

						buttonTwo.onclick = async  function( e ) {

							let getIdButtonPresent = document.getElementById(`${e.target.dataset.employee}-present-${e.target.dataset.attendance}`)
							let getIdButtonAbsent = document.getElementById(`${e.target.dataset.employee}-absent-${e.target.dataset.attendance}`)
							let getDivLoading = document.getElementById(`loading-${e.target.dataset.employee}-${e.target.dataset.attendance}`)
							let getFila = document.getElementById(`${e.target.dataset.employee}-fila`)
							let tableAttendance = document.getElementById('table_attendance').childNodes;

							getIdButtonPresent.style.display = 'none'
							getIdButtonAbsent.style.display = 'none'
							getDivLoading.style.display = 'block'
							getDivLoading.style.marginLeft = '105px'

							let saveDivOnRow = []
							let divOnRow = document.getElementById('table_attendance').childNodes;

							for (let div of divOnRow) {
								if (div.childNodes.length) {
									saveDivOnRow.push(div);
								}
							}

							let tamanoTabla = saveDivOnRow.length

							setTimeout( async ()=>{

								const updateAttendace = await $.ajax({
									url: `https://recursoshumanos.shalom.com.pe/api/update-assistance-of-employee/${e.target.dataset.employee}/${e.target.dataset.attendance}/Absent`,
									type: "GET",
								})

								getFila.remove()
								tamanoTabla--

								if ( tamanoTabla == 0 ) {

									$('#attendance_cero').show();

									// VERIFICANDO SI LA TABLA REPORTADOS ESTA VACIA
									let saveDivOnRowReported = []
									let divOnRowReported = document.getElementById('table_not_reported').childNodes;

									for (let divReported of divOnRowReported) {
										if (divReported.childNodes.length) {
											saveDivOnRowReported.push(divReported);
										}
									}

									let tamanoTablaReported = saveDivOnRowReported.length


									// VERIFICANDO SI LA TABLA CONTRATOS ESTA VACIA
									let saveDivOnRowContract = []
									let divOnRowContract = document.getElementById('table_body_donwload_contract').childNodes;

									for (let divContract of divOnRowContract) {
										if (divContract.childNodes.length) {
											saveDivOnRowContract.push(divContract);
										}
									}

									let tamanoTablaContract = saveDivOnRowContract.length

									// VERIFICANDO SI LA TABLA BOLETAS ESTA VACIA
									let saveDivOnRowPayroll = []
									let divOnRowPayroll = document.getElementById('table_body_donwload').childNodes;

									for (let divPayroll of divOnRowPayroll) {
										if (divPayroll.childNodes.length) {
											saveDivOnRowPayroll.push(divPayroll);
										}
									}

									let tamanoTablaPayroll = saveDivOnRowPayroll.length

									let attendanceCorrections2 = await attendanceCorrectionsTable(users_permission.message[args.usr])

									if ( attendanceCorrections2.dataAttendance.length !== 0 ) {
										alert('Tiene asistencias pendientes de corregir')
										return false
									}

									if ( attendanceCorrections2.dataEmployee.employees.length !== 0 && attendanceCorrections2.dataEmployee.restriction ) {
										alert('Sus trabajadores aun no han descargado sus boletas de pago')
										return false
									}

									if ( attendanceCorrections2.dataEmployeeContract.employees.length !== 0 && attendanceCorrections2.dataEmployeeContract.restriction ) {
										alert('Sus trabajadores aun no han descargado sus contratos')
										return false
									}

									if ( attendanceCorrections2.dataNotReported.length !== 0 ) {
										alert('Tiene empleados no reportados, comuniquese con recursos humanos')
										return false
									}

									if ( attendanceCorrections.dataEmployee.status || attendanceCorrections.dataEmployeeContract.status ) {
										if ( attendanceCorrections.dataEmployee.restriction || attendanceCorrections.dataEmployeeContract.restriction ) {
											if (tamanoTablaReported == 0 && tamanoTablaContract == 0 && tamanoTablaPayroll == 0) {
												return frappe.call({
													type: "POST",
													args: args,
													callback: callback,
													freeze: true,
													statusCode: login.login_handlers
												});
											}
										} else {
											if (tamanoTablaReported == 0) {
												return frappe.call({
													type: "POST",
													args: args,
													callback: callback,
													freeze: true,
													statusCode: login.login_handlers
												});
											}
										}
									} else {
										if (tamanoTablaReported == 0) {
											return frappe.call({
												type: "POST",
												args: args,
												callback: callback,
												freeze: true,
												statusCode: login.login_handlers
											});
										}
									}

								}
							},500)

						}

						divChildrenOne.appendChild(spanOne)
						divChildrenTwo.appendChild(spanTwo)
						divChildrenThree.appendChild(spanThree)
						divChildrenFour.appendChild(spanFour)

						divChildrenFive.appendChild(buttonOne)
						divChildrenFive.appendChild(buttonTwo)
						divChildrenFive.appendChild(loadingDiv)

						divParent.appendChild(divChildrenOne)
						divParent.appendChild(divChildrenTwo)
						divParent.appendChild(divChildrenThree)
						divParent.appendChild(divChildrenFour)
						divParent.appendChild(divChildrenFive)

						table_attendance.appendChild(divParent);

					}

					$('#loading_spinner_attendance').hide();
					$('#table_attendance').show();


				} else {

					$('#loading_spinner_attendance').hide();
					$('#attendance_cero').show();

					tableAttedance.style.opacity = 0;
					labelAttedance.style.opacity = 0;

					setTimeout(function () {
						tableAttedance.style.display = "none";
						labelAttedance.style.display = "none";
					}, 2000)
				}

				if ( attendanceCorrections.dataNotReported.length ) {

					let table_reported = document.getElementById('table_not_reported')
					let loadingSpinner = document.getElementById('loading_spinner_reported')
					let arrayReported = attendanceCorrections.dataNotReported
					let counta = 1

					for( const reported of arrayReported ) {

						let divParent = document.createElement('div')
						divParent.classList.add('data-row', 'row')

						let divChildrenOne = document.createElement('div')
						divChildrenOne.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-2');
						let spanOne = document.createElement('span')
						spanOne.classList.add('hidden-xs', 'text-center', 'font-weight-bold');
						spanOne.innerHTML = counta
						counta++

						let divChildrenTwo = document.createElement('div')
						divChildrenTwo.classList.add('col', 'grid-static-col', 'col-xs-5', 'text-center');
						let spanTwo = document.createElement('span')
						spanTwo.classList.add('field-area', 'static-area', 'ellipsis');
						spanTwo.innerHTML = reported.branch

						let divChildrenThree = document.createElement('div')
						divChildrenThree.classList.add('col', 'grid-static-col', 'col-xs-5', 'text-center');
						let spanThree = document.createElement('span')
						spanThree.classList.add('field-area', 'static-area', 'ellipsis');
						spanThree.innerHTML = reported.nombre_completo

						divChildrenOne.appendChild(spanOne)
						divChildrenTwo.appendChild(spanTwo)
						divChildrenThree.appendChild(spanThree)

						divParent.appendChild(divChildrenOne)
						divParent.appendChild(divChildrenTwo)
						divParent.appendChild(divChildrenThree)

						table_reported.appendChild(divParent);

					}

					$('#loading_spinner_reported').hide();
					$('#table_not_reported').show();

				} else {
					$('#loading_spinner_reported').hide();
					$('#reported_cero').show();

					labelNotReported.style.opacity = 0;
					tableNotReported.style.opacity = 0;

					setTimeout(function () {
						tableNotReported.style.display = "none";
						labelNotReported.style.display = "none";
					}, 2000)
				}

				if ( attendanceCorrections.dataEmployee.status && attendanceCorrections.dataEmployee.employees.length !== 0 ) {

					let table_download = document.getElementById('table_body_donwload')
					let arrayReported = attendanceCorrections.dataEmployee.employees
					let counta = 1

					for( const reported of arrayReported ) {

						let divParent = document.createElement('div')
						divParent.classList.add('data-row', 'row')

						let divChildrenOne = document.createElement('div')
						divChildrenOne.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-1');
						let spanOne = document.createElement('span')
						spanOne.classList.add('hidden-xs', 'text-center', 'font-weight-bold');
						spanOne.innerHTML = counta
						counta++

						let divChildrenTwo = document.createElement('div')
						divChildrenTwo.classList.add('col', 'grid-static-col', 'col-xs-3', 'text-center');
						let spanTwo = document.createElement('span')
						spanTwo.classList.add('field-area', 'static-area', 'ellipsis');
						spanTwo.innerHTML = reported.name

						let divChildrenThree = document.createElement('div')
						divChildrenThree.classList.add('col', 'grid-static-col', 'col-xs-4', 'text-center');
						let spanThree = document.createElement('span')
						spanThree.classList.add('field-area', 'static-area', 'ellipsis');
						spanThree.innerHTML = reported.branch

						let divChildrenFour = document.createElement('div')
						divChildrenFour.classList.add('col', 'grid-static-col', 'col-xs-4', 'text-center');
						let spanFour = document.createElement('span')
						spanFour.classList.add('field-area', 'static-area', 'ellipsis');
						spanFour.innerHTML = reported.nombre_completo

						divChildrenOne.appendChild(spanOne)
						divChildrenTwo.appendChild(spanTwo)
						divChildrenThree.appendChild(spanThree)
						divChildrenFour.appendChild(spanFour)

						divParent.appendChild(divChildrenOne)
						divParent.appendChild(divChildrenTwo)
						divParent.appendChild(divChildrenThree)
						divParent.appendChild(divChildrenFour)

						table_download.appendChild(divParent);

					}

					$('#loading_spinner_download').hide();
					$('#table_body_donwload').show();

				} else {
					$('#loading_spinner_download').hide();
					$('#download_empty').show();

					labelNotDownloadPayroll.style.opacity = 0;
					tableNotDownloadPayroll.style.opacity = 0;

					setTimeout(function () {
						tableNotDownloadPayroll.style.display = "none";
						labelNotDownloadPayroll.style.display = "none";
					}, 2000)
				}

				if ( attendanceCorrections.dataEmployeeContract.status && attendanceCorrections.dataEmployeeContract.employees.length !== 0 ) {

					let table_download = document.getElementById('table_body_donwload_contract')
					let arrayReported = attendanceCorrections.dataEmployeeContract.employees
					let counta = 1

					for( const reported of arrayReported ) {

						let divParent = document.createElement('div')
						divParent.classList.add('data-row', 'row')

						let divChildrenOne = document.createElement('div')
						divChildrenOne.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-1');
						let spanOne = document.createElement('span')
						spanOne.classList.add('hidden-xs', 'text-center', 'font-weight-bold');
						spanOne.innerHTML = counta
						counta++

						let divChildrenTwo = document.createElement('div')
						divChildrenTwo.classList.add('col', 'grid-static-col', 'col-xs-3', 'text-center');
						let spanTwo = document.createElement('span')
						spanTwo.classList.add('field-area', 'static-area', 'ellipsis');
						spanTwo.innerHTML = reported.name

						let divChildrenThree = document.createElement('div')
						divChildrenThree.classList.add('col', 'grid-static-col', 'col-xs-4', 'text-center');
						let spanThree = document.createElement('span')
						spanThree.classList.add('field-area', 'static-area', 'ellipsis');
						spanThree.innerHTML = reported.branch

						let divChildrenFour = document.createElement('div')
						divChildrenFour.classList.add('col', 'grid-static-col', 'col-xs-4', 'text-center');
						let spanFour = document.createElement('span')
						spanFour.classList.add('field-area', 'static-area', 'ellipsis');
						spanFour.innerHTML = reported.nombre_completo

						divChildrenOne.appendChild(spanOne)
						divChildrenTwo.appendChild(spanTwo)
						divChildrenThree.appendChild(spanThree)
						divChildrenFour.appendChild(spanFour)

						divParent.appendChild(divChildrenOne)
						divParent.appendChild(divChildrenTwo)
						divParent.appendChild(divChildrenThree)
						divParent.appendChild(divChildrenFour)

						table_download.appendChild(divParent);

					}

					$('#loading_spinner_download_contract').hide();
					$('#table_body_donwload_contract').show();

				} else {
					$('#loading_spinner_download_contract').hide();
					$('#download_contract_empty').show();

					labelNotDownloadContract.style.opacity = 0;
					tableNotDownloadContract.style.opacity = 0;

					setTimeout(function () {
						tableNotDownloadContract.style.display = "none";
						labelNotDownloadContract.style.display = "none";
					}, 2000)
				}

				buttonJoinErp.disabled = false
				joinErpSpinner.style.display = 'none'
				buttonJoinErp.style.display = 'block'
				buttonJoinErp.addEventListener("click", async function() {

					joinErpSpinner.style.display = 'block'
					buttonJoinErp.style.display = 'none'

					if(users_permission.message[args.usr] != undefined){
						let attendanceCorrections2 = await attendanceCorrectionsTable(users_permission.message[args.usr])

						if (!attendanceCorrections2.validation) {
							joinErpSpinner.style.display = 'none'
							buttonJoinErp.style.display = 'block'
							frappe.msgprint(attendanceCorrections2.msn)
							return false;
						}

						if (attendanceCorrections2.data_renewal.status && attendanceCorrections2.data_renewal.renewals.length) {
							alert('Tiene solicitudes pendientes de validar')
							joinErpSpinner.style.display = 'none'
							buttonJoinErp.style.display = 'block'
							return false
						}

						if ( attendanceCorrections2.dataAttendance.length !== 0 ) {
							alert('Tiene asistencias pendientes de corregir')
							joinErpSpinner.style.display = 'none'
							buttonJoinErp.style.display = 'block'
							return false
						}

						if ( attendanceCorrections2.dataEmployee.employees.length !== 0 && attendanceCorrections2.dataEmployee.restriction ) {
							alert('Sus trabajadores aun no han descargado sus boletas de pago')
							joinErpSpinner.style.display = 'none'
							buttonJoinErp.style.display = 'block'
							return false
						}

						if ( attendanceCorrections2.dataEmployeeContract.employees.length !== 0 && attendanceCorrections2.dataEmployeeContract.restriction ) {
							alert('Sus trabajadores aun no han descargado sus contratos')
							joinErpSpinner.style.display = 'none'
							buttonJoinErp.style.display = 'block'
							return false
						}

						if ( attendanceCorrections2.dataNotReported.length !== 0 ) {
							alert('Tiene empleados no reportados, comuniquese con recursos humanos')
							joinErpSpinner.style.display = 'none'
							buttonJoinErp.style.display = 'block'
							return false
						}
					}

					return frappe.call({
						type: "POST",
						args: args,
						callback: callback,
						freeze: true,
						statusCode: login.login_handlers
					});

				});

				if (attendanceCorrections.dataAttendance.length == 0 && attendanceCorrections.dataNotReported.length == 0
					&& attendanceCorrections.dataEmployee.employees.length == 0
					&& attendanceCorrections.dataEmployeeContract.employees.length == 0
					&& attendanceCorrections.data_renewal.status == false) {
					frappe.hide_msgprint()
					return frappe.call({
						type: "POST",
						args: args,
						callback: callback,
						freeze: true,
						statusCode: login.login_handlers
					});
				}

			},600)

			return false

		} else {
			$('#loading_spinner_attendance').hide();
			$('#attendance_cero').show();
			$('#loading_spinner_reported').hide();
			$('#reported_cero').show();
			$('#loading_spinner_download').hide();
			$('#download_empty').show();
		}

		return frappe.call({
			type: "POST",
			args: args,
			callback: callback,
			freeze: true,
			statusCode: login.login_handlers
		});

	}
	/** SI TIENE ROL DE ADMINISTRADOR O ENCARGADO ENTRARA A ESTE IF */
	else if ( rolUser.message.length > 0 ) {

		let verifiedSuper = await verifiedSupervition(rolUser.message);

		if ( !verifiedSuper.status && verifiedSuper.supervition == false ) {
			frappe.msgprint(verifiedSuper.msn)
			return false;
		}

		if ( !verifiedSuper.status && verifiedSuper.supervition == true ) {
			frappe.msgprint({
				title: "Alerta",
				message: verifiedSuper.msn,
				indicator: "red", // Puedes personalizar el indicador de color si lo deseas
			});
			setTimeout(()=>{

				let table_supervision = document.getElementById('table_supervision')
				let warehouseItems = verifiedSuper.warehouse
				let loadingSpinner = document.getElementById('loading_spinner')
				let counta = 1
				for (const key in warehouseItems) {

					if (warehouseItems.hasOwnProperty(key)) {
						const warehouse = warehouseItems[key];

						let divParent = document.createElement('div')
						divParent.classList.add('data-row', 'row')

						let divChildrenOne = document.createElement('div')
						divChildrenOne.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-2');
						let spanOne = document.createElement('span')
						spanOne.classList.add('hidden-xs', 'text-center', 'font-weight-bold');
						spanOne.innerHTML = counta
						counta++
						let divChildrenTwo = document.createElement('div')
						divChildrenTwo.classList.add('col', 'grid-static-col', 'col-xs-10', 'text-center');
						let spanTwo = document.createElement('span')
						spanTwo.classList.add('field-area', 'static-area', 'ellipsis');
						spanTwo.innerHTML = warehouse.name

						divChildrenOne.appendChild(spanOne)
						divChildrenTwo.appendChild(spanTwo)
						divParent.appendChild(divChildrenOne)
						divParent.appendChild(divChildrenTwo)

						table_supervision.appendChild(divParent);

					}

				}

				const idButton = document.getElementById("SendData");
				const idButton2 = document.getElementById("SendData2");

				idButton.addEventListener("click", function() {
					let vent1 = window.open('https://capacitacion.shalom.com.pe/files/SUPERVISION%20ALMACEN.mp4', '_blank');
				});

				idButton2.addEventListener("click", function() {
					idButton2.disabled = true

					return frappe.call({
						type: "POST",
						args: args,
						callback: callback,
						freeze: true,
						statusCode: login.login_handlers
					});

				});

				$('#loading_spinner').hide();
				$('#table_supervision').show();

			},600)
			return false;
		}

		let verifiedSuperStore = await verifiedSupervitionStore(rolUser.message);

		if ( !verifiedSuperStore.status && verifiedSuperStore.supervition == false ) {
			frappe.msgprint(verifiedSuperStore.msn)
			return false;
		}

		if ( !verifiedSuperStore.status && verifiedSuperStore.supervition == true ) {
			frappe.msgprint({
				title: "Alerta",
				message: verifiedSuperStore.msn,
				indicator: "red", // Puedes personalizar el indicador de color si lo deseas
			});
			setTimeout(()=>{

				let table_supervision = document.getElementById('table_supervision')
				let warehouseItems = verifiedSuperStore.warehouse
				let loadingSpinner = document.getElementById('loading_spinner')

				let counta = 1
				for (const key in warehouseItems) {

					if (warehouseItems.hasOwnProperty(key)) {
						const warehouse = warehouseItems[key];

						let divParent = document.createElement('div')
						divParent.classList.add('data-row', 'row')

						let divChildrenOne = document.createElement('div')
						divChildrenOne.classList.add('row-index', 'sortable-handle', 'col', 'col-xs-2');
						let spanOne = document.createElement('span')
						spanOne.classList.add('hidden-xs', 'text-center', 'font-weight-bold');
						spanOne.innerHTML = counta
						counta++
						let divChildrenTwo = document.createElement('div')
						divChildrenTwo.classList.add('col', 'grid-static-col', 'col-xs-10', 'text-center');
						let spanTwo = document.createElement('span')
						spanTwo.classList.add('field-area', 'static-area', 'ellipsis');
						spanTwo.innerHTML = warehouse.name

						divChildrenOne.appendChild(spanOne)
						divChildrenTwo.appendChild(spanTwo)
						divParent.appendChild(divChildrenOne)
						divParent.appendChild(divChildrenTwo)

						table_supervision.appendChild(divParent);

					}

				}

				const idButton2 = document.getElementById("SendData2");

				idButton2.addEventListener("click", function() {
					idButton2.disabled = true
					return frappe.call({
						type: "POST",
						args: args,
						callback: callback,
						freeze: true,
						statusCode: login.login_handlers
					});

				});

				$('#loading_spinner').hide();
				$('#table_supervision').show();

			},600)
			return false;
		}

		if ( verifiedSuperStore.status && verifiedSuperStore.supervition == false ) {
			frappe.hide_msgprint()
			return frappe.call({
				type: "POST",
				args: args,
				callback: callback,
				freeze: true,
				statusCode: login.login_handlers
			});
		}

		if ( verifiedSuper.status && verifiedSuper.supervition == false ) {
			return frappe.call({
				type: "POST",
				args: args,
				callback: callback,
				freeze: true,
				statusCode: login.login_handlers
			});
		}

	} else {

		return frappe.call({
			type: "POST",
			args: args,
			callback: callback,
			freeze: true,
			statusCode: login.login_handlers
		});
	}

}

login.set_status = function (message, color) {
	$('section:visible .btn-primary').text(message)
	if (color == "red") {
		$('section:visible .page-card-body').addClass("invalid");
	}
}

login.set_invalid = function (message) {
	$(".login-content.page-card").addClass('invalid-login');
	setTimeout(() => {
		$(".login-content.page-card").removeClass('invalid-login');
	}, 500)
	login.set_status(message, 'red');
	$("#login_password").focus();
}

login.login_handlers = (function () {



	var get_error_handler = function (default_message) {
		return function (xhr, data) {
			if (xhr.responseJSON) {
				data = xhr.responseJSON;
			}

			var message = default_message;
			if (data._server_messages) {
				message = ($.map(JSON.parse(data._server_messages || '[]'), function (v) {
					// temp fix for messages sent as dict
					try {
						return JSON.parse(v).message;
					} catch (e) {
						return v;
					}
				}) || []).join('<br>') || default_message;
			}

			if (message === default_message) {
				login.set_invalid(message);
			} else {
				login.reset_sections(false);
			}

		};
	}



	var login_handlers = {

		200: function (data) {

			if (data.message == 'Logged In') {
				login.set_status('{{ _("Success") }}', 'green');
				let buttonLogin = document.getElementsByClassName('btn-login')

				buttonLogin[0].innerHTML = `<div class="spinner-border" role="status" id="loading_spinner" style="margin-left: 10px;">
							  <span class="visually-hidden"></span>
							</div>`
				let user = $("#login_email").val()
				if (user == "broker@shalomcontrol.com") {
					window.location.href = "/app/sctr-2";
				} else {
					frappe.hide_msgprint()
					$.ajax({
						url: "https://capacitacion.shalom.com.pe/api/method/erpnext.hr.doctype.attendance.api.serviceUser?user="+user,
						type: "GET",
						success: function (json) {

							$.ajax({
								url: "https://capacitacion.shalom.com.pe/api/method/erpnext.hr.doctype.attendance.api.getRoles?user="+user,
								type: "GET",
								success: function (json1) {

									if ( json1.message.length > 0 ) {
										window.location.href = "/app/supervicion-almacen";
									} else if (json.message.valor) {
										if (document.referrer.includes("/lms/course")) {
											window.location.href = document.referrer
										} else {
											window.location.href = "/lms";
										}
									} else {
										window.location.href = "/app";
									}
								},
								error: function (xhr, status) {
									window.location.href = "/app";
								}
							})

						},
						error: function (xhr, status) {
							window.location.href = "/app";
						}
					})
				}

			}
			else if (data.message == 'Password Reset') {
				window.location.href = frappe.utils.sanitise_redirect(data.redirect_to);
			} else if (data.message == "No App") {
				login.set_status("{{ _('Success') }}", 'green');
				if (localStorage) {
					var last_visited =
						localStorage.getItem("last_visited")
						|| frappe.utils.sanitise_redirect(frappe.utils.get_url_arg("redirect-to"));
					localStorage.removeItem("last_visited");
				}

				if (data.redirect_to) {
					window.location.href = frappe.utils.sanitise_redirect(data.redirect_to);
				}

				if (last_visited && last_visited != "/login") {
					window.location.href = last_visited;
				} else {
					window.location.href = data.home_page;
				}
			}
			else if (window.location.hash === '#forgot') {
				if (data.message === 'not found') {
					login.set_status('{{ _("Not a valid user") }}', 'red');
				} else if (data.message == 'not allowed') {
					login.set_status('{{ _("Not Allowed") }}', 'red');
				} else if (data.message == 'disabled') {
					login.set_status('{{ _("Not Allowed: Disabled User") }}', 'red');
				} else {
					login.set_status('{{ _("Instructions Emailed") }}', 'green');
				}


			}
			else if (window.location.hash === '#signup') {
				if (cint(data.message[0]) == 0) {
					login.set_status(data.message[1], 'red');
				} else {
					login.set_status('{{ _("Success") }}', 'green');
					frappe.msgprint(data.message[1])
				}
				//login.set_status(__(data.message), 'green');
			}

			//OTP verification
			if (data.verification && data.message != 'Logged In') {
				login.set_status('{{ _("Success") }}', 'green');

				document.cookie = "tmp_id=" + data.tmp_id;

				if (data.verification.method == 'OTP App') {
					continue_otp_app(data.verification.setup, data.verification.qrcode);
				} else if (data.verification.method == 'SMS') {
					continue_sms(data.verification.setup, data.verification.prompt);
				} else if (data.verification.method == 'Email') {
					continue_email(data.verification.setup, data.verification.prompt);
				}
			}
		},
		401: get_error_handler('{{ _("Invalid Login. Try again.") }}'),
		417: get_error_handler('{{ _("Oops! Something went wrong") }}')
	};

	return login_handlers;
})();

frappe.ready(function () {

	login.bind_events();

	if (!window.location.hash) {
		window.location.hash = "#login";
	} else {
		$(window).trigger("hashchange");
	}

	$(".form-signup, .form-forgot").removeClass("hide");
	$(document).trigger('login_rendered');
});

var verify_token = function (event) {
	$(".form-verify").on("submit", function (eventx) {
		eventx.preventDefault();
		var args = {};
		args.cmd = "login";
		args.otp = $("#login_token").val();
		args.tmp_id = frappe.get_cookie('tmp_id');
		if (!args.otp) {
			frappe.msgprint('{{ _("Login token required") }}');
			return false;
		}
		login.call(args);
		return false;
	});
}

var request_otp = function (r) {
	$('.login-content').empty();
	$('.login-content:visible').append(
		`<div id="twofactor_div">
			<form class="form-verify">
				<div class="page-card-head">
					<span class="indicator blue" data-text="Verification">{{ _("Verification") }}</span>
				</div>
				<div id="otp_div"></div>
				<input type="text" id="login_token" autocomplete="off" class="form-control" placeholder={{ _("Verification Code") }} required="" autofocus="">
				<button class="btn btn-sm btn-primary btn-block mt-3" id="verify_token">{{ _("Verify") }}</button>
			</form>
		</div>`
	);
	// add event handler for submit button
	verify_token();
}

var continue_otp_app = function (setup, qrcode) {
	request_otp();
	var qrcode_div = $('<div class="text-muted" style="padding-bottom: 15px;"></div>');

	if (setup) {
		direction = $('<div>').attr('id', 'qr_info').text('{{ _("Enter Code displayed in OTP App.") }}');
		qrcode_div.append(direction);
		$('#otp_div').prepend(qrcode_div);
	} else {
		direction = $('<div>').attr('id', 'qr_info').text('{{ _("OTP setup using OTP App was not completed. Please contact Administrator.") }}');
		qrcode_div.append(direction);
		$('#otp_div').prepend(qrcode_div);
	}
}

var continue_sms = function (setup, prompt) {
	request_otp();
	var sms_div = $('<div class="text-muted" style="padding-bottom: 15px;"></div>');

	if (setup) {
		sms_div.append(prompt)
		$('#otp_div').prepend(sms_div);
	} else {
		direction = $('<div>').attr('id', 'qr_info').text(prompt || '{{ _("SMS was not sent. Please contact Administrator.") }}');
		sms_div.append(direction);
		$('#otp_div').prepend(sms_div)
	}
}

var continue_email = function (setup, prompt) {
	request_otp();
	var email_div = $('<div class="text-muted" style="padding-bottom: 15px;"></div>');

	if (setup) {
		email_div.append(prompt)
		$('#otp_div').prepend(email_div);
	} else {
		var direction = $('<div>').attr('id', 'qr_info').text(prompt || '{{ _("Verification code email not sent. Please contact Administrator.") }}');
		email_div.append(direction);
		$('#otp_div').prepend(email_div);
	}
}
