# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

from __future__ import unicode_literals, print_function

from six import iteritems, text_type, string_types, PY2

from frappe.utils import cstr

"""
	frappe.translate
	~~~~~~~~~~~~~~~~

	Translation tools for frappe
"""

import frappe, os, re, io, codecs, json
from frappe.model.utils import render_include, InvalidIncludePath
from frappe.utils import strip, strip_html_tags, is_html
import itertools, operator

def guess_language(lang_list=None):
	"""Set `frappe.local.lang` from HTTP headers at beginning of request"""
	user_preferred_language = frappe.request.cookies.get('preferred_language')
	is_guest_user = not frappe.session.user or frappe.session.user == 'Guest'
	if is_guest_user and user_preferred_language:
		return user_preferred_language

	lang_codes = frappe.request.accept_languages.values()
	if not lang_codes:
		return frappe.local.lang

	guess = None
	if not lang_list:
		lang_list = get_all_languages() or []

	for l in lang_codes:
		code = l.strip()
		if not isinstance(code, text_type):
			code = text_type(code, 'utf-8')
		if code in lang_list or code == "en":
			guess = code
			break

		# check if parent language (pt) is setup, if variant (pt-BR)
		if "-" in code:
			code = code.split("-")[0]
			if code in lang_list:
				guess = code
				break

	return guess or frappe.local.lang

def get_user_lang(user=None):
	"""Set frappe.local.lang from user preferences on session beginning or resumption"""
	if not user:
		user = frappe.session.user

	# via cache
	lang = frappe.cache().hget("lang", user)

	if not lang:

		# if defined in user profile
		lang = frappe.db.get_value("User", user, "language")
		if not lang:
			lang = frappe.db.get_default("lang")

		if not lang:
			lang = frappe.local.lang or 'en'

		frappe.cache().hset("lang", user, lang)

	return lang

def get_lang_code(lang):
	return frappe.db.get_value('Language', {'language_name': lang}) or lang

def set_default_language(lang):
	"""Set Global default language"""
	if frappe.db.get_default("lang") != lang:
		frappe.db.set_default("lang", lang)
	frappe.local.lang = lang

def get_lang_dict():
	"""Returns all languages in dict format, full name is the key e.g. `{"english":"en"}`"""
	return dict(frappe.db.sql('select language_name, name from tabLanguage'))

def get_dict(fortype, name=None):
	"""Returns translation dict for a type of object.

	 :param fortype: must be one of `doctype`, `page`, `report`, `include`, `jsfile`, `boot`
	 :param name: name of the document for which assets are to be returned.
	 """
	fortype = fortype.lower()
	cache = frappe.cache()
	asset_key = fortype + ":" + (name or "-")
	translation_assets = cache.hget("translation_assets", frappe.local.lang, shared=True) or {}

	if not asset_key in translation_assets:
		messages = []
		if fortype=="doctype":
			messages = get_messages_from_doctype(name)
		elif fortype=="page":
			messages = get_messages_from_page(name)
		elif fortype=="report":
			messages = get_messages_from_report(name)
		elif fortype=="include":
			messages = get_messages_from_include_files()
		elif fortype=="jsfile":
			messages = get_messages_from_file(name)
		elif fortype=="boot":
			apps = frappe.get_all_apps(True)
			for app in apps:
				messages.extend(get_server_messages(app))

			messages += get_messages_from_navbar()
			messages += get_messages_from_include_files()
			messages += frappe.db.sql("select 'Print Format:', name from `tabPrint Format`")
			messages += frappe.db.sql("select 'DocType:', name from tabDocType")
			messages += frappe.db.sql("select 'Role:', name from tabRole")
			messages += frappe.db.sql("select 'Module:', name from `tabModule Def`")
			messages += frappe.db.sql("select '', format from `tabWorkspace Shortcut` where format is not null")
			messages += frappe.db.sql("select '', title from `tabOnboarding Step`")

		messages = deduplicate_messages(messages)
		message_dict = make_dict_from_messages(messages, load_user_translation=False)
		message_dict.update(get_dict_from_hooks(fortype, name))
		# remove untranslated
		message_dict = {k:v for k, v in iteritems(message_dict) if k!=v}
		translation_assets[asset_key] = message_dict
		cache.hset("translation_assets", frappe.local.lang, translation_assets, shared=True)

	translation_map = translation_assets[asset_key]

	translation_map.update(get_user_translations(frappe.local.lang))

	return translation_map


def get_dict_from_hooks(fortype, name):
	translated_dict = {}

	hooks = frappe.get_hooks("get_translated_dict")
	for (hook_fortype, fortype_name) in hooks:
		if hook_fortype == fortype and fortype_name == name:
			for method in hooks[(hook_fortype, fortype_name)]:
				translated_dict.update(frappe.get_attr(method)())

	return translated_dict

def make_dict_from_messages(messages, full_dict=None, load_user_translation=True):
	"""Returns translated messages as a dict in Language specified in `frappe.local.lang`

	:param messages: List of untranslated messages
	"""
	out = {}
	if full_dict==None:
		if load_user_translation:
			full_dict = get_full_dict(frappe.local.lang)
		else:
			full_dict = load_lang(frappe.local.lang)

	for m in messages:
		if m[1] in full_dict:
			out[m[1]] = full_dict[m[1]]
		# check if msg with context as key exist eg. msg:context
		if len(m) > 2 and m[2]:
			key = m[1] + ':' + m[2]
			if full_dict.get(key):
				out[key] = full_dict[key]

	return out

def get_lang_js(fortype, name):
	"""Returns code snippet to be appended at the end of a JS script.

	:param fortype: Type of object, e.g. `DocType`
	:param name: Document name
	"""
	return "\n\n$.extend(frappe._messages, %s)" % json.dumps(get_dict(fortype, name))

def get_full_dict(lang):
	"""Load and return the entire translations dictionary for a language from :meth:`frape.cache`

	:param lang: Language Code, e.g. `hi`
	"""
	if not lang:
		return {}

	# found in local, return!
	if getattr(frappe.local, 'lang_full_dict', None) and frappe.local.lang_full_dict.get(lang, None):
		return frappe.local.lang_full_dict

	frappe.local.lang_full_dict = load_lang(lang)

	try:
		# get user specific translation data
		user_translations = get_user_translations(lang)
		frappe.local.lang_full_dict.update(user_translations)
	except Exception:
		pass

	return frappe.local.lang_full_dict

def load_lang(lang, apps=None):
	"""Combine all translations from `.csv` files in all `apps`.
	For derivative languages (es-GT), take translations from the
	base language (es) and then update translations from the child (es-GT)"""

	if lang=='en':
		return {}

	out = frappe.cache().hget("lang_full_dict", lang, shared=True)
	if not out:
		out = {}
		for app in (apps or frappe.get_all_apps(True)):
			path = os.path.join(frappe.get_pymodule_path(app), "translations", lang + ".csv")
			out.update(get_translation_dict_from_file(path, lang, app) or {})

		if '-' in lang:
			parent = lang.split('-')[0]
			parent_out = load_lang(parent)
			parent_out.update(out)
			out = parent_out

		frappe.cache().hset("lang_full_dict", lang, out, shared=True)

	return out or {}

def get_translation_dict_from_file(path, lang, app):
	"""load translation dict from given path"""
	translation_map = {}
	if os.path.exists(path):
		csv_content = read_csv_file(path)

		for item in csv_content:
			if len(item)==3 and item[2]:
				key = item[0] + ':' + item[2]
				translation_map[key] = strip(item[1])
			elif len(item) in [2, 3]:
				translation_map[item[0]] = strip(item[1])
			elif item:
				raise Exception("Bad translation in '{app}' for language '{lang}': {values}".format(
					app=app, lang=lang, values=repr(item).encode("utf-8")
				))

	return translation_map

def get_user_translations(lang):
	if not frappe.db:
		frappe.connect()
	out = frappe.cache().hget('lang_user_translations', lang)
	if out is None:
		out = {}
		user_translations = frappe.get_all('Translation',
			fields=["source_text", "translated_text", "context"],
			filters={'language': lang})

		for translation in user_translations:
			key = translation.source_text
			value = translation.translated_text
			if translation.context:
				key += ':' + translation.context
			out[key] = value

		frappe.cache().hset('lang_user_translations', lang, out)

	return out


def clear_cache():
	"""Clear all translation assets from :meth:`frappe.cache`"""
	cache = frappe.cache()
	cache.delete_key("langinfo")

	# clear translations saved in boot cache
	cache.delete_key("bootinfo")
	cache.delete_key("lang_full_dict", shared=True)
	cache.delete_key("translation_assets", shared=True)
	cache.delete_key("lang_user_translations")

def get_messages_for_app(app, deduplicate=True):
	"""Returns all messages (list) for a specified `app`"""
	messages = []
	modules = ", ".join(['"{}"'.format(m.title().replace("_", " ")) \
		for m in frappe.local.app_modules[app]])

	# doctypes
	if modules:
		for name in frappe.db.sql_list("""select name from tabDocType
			where module in ({})""".format(modules)):
			messages.extend(get_messages_from_doctype(name))

		# pages
		for name, title in frappe.db.sql("""select name, title from tabPage
			where module in ({})""".format(modules)):
			messages.append((None, title or name))
			messages.extend(get_messages_from_page(name))


		# reports
		for name in frappe.db.sql_list("""select tabReport.name from tabDocType, tabReport
			where tabReport.ref_doctype = tabDocType.name
				and tabDocType.module in ({})""".format(modules)):
			messages.append((None, name))
			messages.extend(get_messages_from_report(name))
			for i in messages:
				if not isinstance(i, tuple):
					raise Exception

	# workflow based on app.hooks.fixtures
	messages.extend(get_messages_from_workflow(app_name=app))

	# custom fields based on app.hooks.fixtures
	messages.extend(get_messages_from_custom_fields(app_name=app))

	# app_include_files
	messages.extend(get_all_messages_from_js_files(app))

	# server_messages
	messages.extend(get_server_messages(app))

	# messages from navbar settings
	messages.extend(get_messages_from_navbar())

	if deduplicate:
		messages = deduplicate_messages(messages)

	return messages


def get_messages_from_navbar():
	"""Return all labels from Navbar Items, as specified in Navbar Settings."""
	labels = frappe.get_all('Navbar Item', filters={'item_label': ('is', 'set')}, pluck='item_label')
	return [('Navbar:', label, 'Label of a Navbar Item') for label in labels]


def get_messages_from_doctype(name):
	"""Extract all translatable messages for a doctype. Includes labels, Python code,
	Javascript code, html templates"""
	messages = []
	meta = frappe.get_meta(name)

	messages = [meta.name, meta.module]

	if meta.description:
		messages.append(meta.description)

	# translations of field labels, description and options
	for d in meta.get("fields"):
		messages.extend([d.label, d.description])

		if d.fieldtype=='Select' and d.options:
			options = d.options.split('\n')
			if not "icon" in options[0]:
				messages.extend(options)
		if d.fieldtype=='HTML' and d.options:
			messages.append(d.options)

	# translations of roles
	for d in meta.get("permissions"):
		if d.role:
			messages.append(d.role)

	messages = [message for message in messages if message]
	messages = [('DocType: ' + name, message) for message in messages if is_translatable(message)]

	# extract from js, py files
	if not meta.custom:
		doctype_file_path = frappe.get_module_path(meta.module, "doctype", meta.name, meta.name)
		messages.extend(get_messages_from_file(doctype_file_path + ".js"))
		messages.extend(get_messages_from_file(doctype_file_path + "_list.js"))
		messages.extend(get_messages_from_file(doctype_file_path + "_list.html"))
		messages.extend(get_messages_from_file(doctype_file_path + "_calendar.js"))
		messages.extend(get_messages_from_file(doctype_file_path + "_dashboard.html"))

	# workflow based on doctype
	messages.extend(get_messages_from_workflow(doctype=name))
	return messages

def get_messages_from_workflow(doctype=None, app_name=None):
	assert doctype or app_name, 'doctype or app_name should be provided'

	# translations for Workflows
	workflows = []
	if doctype:
		workflows = frappe.get_all('Workflow', filters={'document_type': doctype})
	else:
		fixtures = frappe.get_hooks('fixtures', app_name=app_name) or []
		for fixture in fixtures:
			if isinstance(fixture, string_types) and fixture == 'Worflow':
				workflows = frappe.get_all('Workflow')
				break
			elif isinstance(fixture, dict) and fixture.get('dt', fixture.get('doctype')) == 'Workflow':
				workflows.extend(frappe.get_all('Workflow', filters=fixture.get('filters')))

	messages  = []
	for w in workflows:
		states = frappe.db.sql(
			'select distinct state from `tabWorkflow Document State` where parent=%s',
			(w['name'],), as_dict=True)

		messages.extend([('Workflow: ' + w['name'], state['state']) for state in states if is_translatable(state['state'])])

		states = frappe.db.sql(
			'select distinct message from `tabWorkflow Document State` where parent=%s and message is not null',
			(w['name'],), as_dict=True)

		messages.extend([("Workflow: " + w['name'], state['message'])
			for state in states if is_translatable(state['message'])])

		actions = frappe.db.sql(
			'select distinct action from `tabWorkflow Transition` where parent=%s',
			(w['name'],), as_dict=True)

		messages.extend([("Workflow: " + w['name'], action['action']) \
			for action in actions if is_translatable(action['action'])])

	return messages


def get_messages_from_custom_fields(app_name):
	fixtures = frappe.get_hooks('fixtures', app_name=app_name) or []
	custom_fields = []

	for fixture in fixtures:
		if isinstance(fixture, string_types) and fixture == 'Custom Field':
			custom_fields = frappe.get_all('Custom Field', fields=['name','label', 'description', 'fieldtype', 'options'])
			break
		elif isinstance(fixture, dict) and fixture.get('dt', fixture.get('doctype')) == 'Custom Field':
			custom_fields.extend(frappe.get_all('Custom Field', filters=fixture.get('filters'),
				fields=['name','label', 'description', 'fieldtype', 'options']))

	messages = []
	for cf in custom_fields:
		for prop in ('label', 'description'):
			if not cf.get(prop) or not is_translatable(cf[prop]):
				continue
			messages.append(('Custom Field - {}: {}'.format(prop, cf['name']), cf[prop]))
		if cf['fieldtype'] == 'Selection' and cf.get('options'):
			for option in cf['options'].split('\n'):
				if option and 'icon' not in option and is_translatable(option):
					messages.append(('Custom Field - Description: ' + cf['name'], option))

	return messages

def get_messages_from_page(name):
	"""Returns all translatable strings from a :class:`frappe.core.doctype.Page`"""
	return _get_messages_from_page_or_report("Page", name)

def get_messages_from_report(name):
	"""Returns all translatable strings from a :class:`frappe.core.doctype.Report`"""
	report = frappe.get_doc("Report", name)
	messages = _get_messages_from_page_or_report("Report", name,
		frappe.db.get_value("DocType", report.ref_doctype, "module"))

	if report.columns:
		context = "Column of report '%s'" % report.name # context has to match context in `prepare_columns` in query_report.js
		messages.extend([(None, report_column.label, context) for report_column in report.columns])

	if report.filters:
		messages.extend([(None, report_filter.label) for report_filter in report.filters])

	if report.query:
		messages.extend([(None, message) for message in re.findall('"([^:,^"]*):', report.query) if is_translatable(message)])

	messages.append((None,report.report_name))
	return messages

def _get_messages_from_page_or_report(doctype, name, module=None):
	if not module:
		module = frappe.db.get_value(doctype, name, "module")

	doc_path = frappe.get_module_path(module, doctype, name)

	messages = get_messages_from_file(os.path.join(doc_path, frappe.scrub(name) +".py"))

	if os.path.exists(doc_path):
		for filename in os.listdir(doc_path):
			if filename.endswith(".js") or filename.endswith(".html"):
				messages += get_messages_from_file(os.path.join(doc_path, filename))

	return messages

def get_server_messages(app):
	"""Extracts all translatable strings (tagged with :func:`frappe._`) from Python modules
		inside an app"""
	messages = []
	file_extensions = ('.py', '.html', '.js', '.vue')
	for basepath, folders, files in os.walk(frappe.get_pymodule_path(app)):
		for dontwalk in (".git", "public", "locale"):
			if dontwalk in folders: folders.remove(dontwalk)

		for f in files:
			f = frappe.as_unicode(f)
			if f.endswith(file_extensions):
				messages.extend(get_messages_from_file(os.path.join(basepath, f)))

	return messages

def get_messages_from_include_files(app_name=None):
	"""Returns messages from js files included at time of boot like desk.min.js for desk and web"""
	messages = []
	app_include_js = frappe.get_hooks("app_include_js", app_name=app_name) or []
	web_include_js = frappe.get_hooks("web_include_js", app_name=app_name) or []
	include_js = app_include_js + web_include_js

	for js_path in include_js:
		relative_path = os.path.join(frappe.local.sites_path, js_path.lstrip('/'))
		messages_from_file = get_messages_from_file(relative_path)
		messages.extend(messages_from_file)

	return messages

def get_all_messages_from_js_files(app_name=None):
	"""Extracts all translatable strings from app `.js` files"""
	messages = []
	for app in ([app_name] if app_name else frappe.get_installed_apps()):
		if os.path.exists(frappe.get_app_path(app, "public")):
			for basepath, folders, files in os.walk(frappe.get_app_path(app, "public")):
				if "frappe/public/js/lib" in basepath:
					continue

				for fname in files:
					if fname.endswith(".js") or fname.endswith(".html") or fname.endswith('.vue'):
						messages.extend(get_messages_from_file(os.path.join(basepath, fname)))

	return messages

def get_messages_from_file(path):
	"""Returns a list of transatable strings from a code file

	:param path: path of the code file
	"""
	frappe.flags.setdefault('scanned_files', [])
	# TODO: Find better alternative
	# To avoid duplicate scan
	if path in set(frappe.flags.scanned_files):
		return []

	frappe.flags.scanned_files.append(path)

	apps_path = get_bench_dir()
	if os.path.exists(path):
		with open(path, 'r') as sourcefile:
			try:
				file_contents = sourcefile.read()
			except Exception:
				print("Could not scan file for translation: {0}".format(path))
				return []
			data = [(os.path.relpath(path, apps_path), message, context, line) \
				for line, message, context in extract_messages_from_code(file_contents)]
			return data
	else:
		# print "Translate: {0} missing".format(os.path.abspath(path))
		return []

def extract_messages_from_code(code):
	"""
		Extracts translatable strings from a code file
		:param code: code from which translatable files are to be extracted
		:param is_py: include messages in triple quotes e.g. `_('''message''')`
	"""
	from jinja2 import TemplateError

	try:
		code = frappe.as_unicode(render_include(code))

	# Exception will occur when it encounters John Resig's microtemplating code
	except (TemplateError, ImportError, InvalidIncludePath, IOError) as e:
		if isinstance(e, InvalidIncludePath):
			frappe.clear_last_message()

		pass

	messages = []
	pattern = r"_\(([\"']{,3})(?P<message>((?!\1).)*)\1(\s*,\s*context\s*=\s*([\"'])(?P<py_context>((?!\5).)*)\5)*(\s*,\s*(.)*?\s*(,\s*([\"'])(?P<js_context>((?!\11).)*)\11)*)*\)"

	for m in re.compile(pattern).finditer(code):
		message = m.group('message')
		context = m.group('py_context') or m.group('js_context')
		pos = m.start()

		if is_translatable(message):
			messages.append([pos, message, context])

	return add_line_number(messages, code)

def is_translatable(m):
	if re.search("[a-zA-Z]", m) and not m.startswith("fa fa-") and not m.endswith("px") and not m.startswith("eval:"):
		return True
	return False

def add_line_number(messages, code):
	ret = []
	messages = sorted(messages, key=lambda x: x[0])
	newlines = [m.start() for m in re.compile('\\n').finditer(code)]
	line = 1
	newline_i = 0
	for pos, message, context in messages:
		while newline_i < len(newlines) and pos > newlines[newline_i]:
			line+=1
			newline_i+= 1
		ret.append([line, message, context])
	return ret

def read_csv_file(path):
	"""Read CSV file and return as list of list

	:param path: File path"""
	from csv import reader

	if PY2:
		with codecs.open(path, 'r', 'utf-8') as msgfile:
			data = msgfile.read()

			# for japanese! #wtf
			data = data.replace(chr(28), "").replace(chr(29), "")
			data = reader([r.encode('utf-8') for r in data.splitlines()])
			newdata = [[text_type(val, 'utf-8') for val in row] for row in data]
	else:
		with io.open(path, mode='r', encoding='utf-8', newline='') as msgfile:
			data = reader(msgfile)
			newdata = [[ val for val in row ] for row in data]
	return newdata

def write_csv_file(path, app_messages, lang_dict):
	"""Write translation CSV file.

	:param path: File path, usually `[app]/translations`.
	:param app_messages: Translatable strings for this app.
	:param lang_dict: Full translated dict.
	"""
	app_messages.sort(key = lambda x: x[1])
	from csv import writer
	with open(path, 'w', newline='') as msgfile:
		w = writer(msgfile, lineterminator='\n')

		for app_message in app_messages:
			context = None
			if len(app_message) == 2:
				path, message = app_message
			elif len(app_message) == 3:
				path, message, lineno = app_message
			elif len(app_message) == 4:
				path, message, context, lineno = app_message
			else:
				continue

			t = lang_dict.get(message, '')
			# strip whitespaces
			translated_string = re.sub(r'{\s?([0-9]+)\s?}', r"{\g<1>}", t)
			if translated_string:
				w.writerow([message, translated_string, context])

def get_untranslated(lang, untranslated_file, get_all=False):
	"""Returns all untranslated strings for a language and writes in a file

	:param lang: Language code.
	:param untranslated_file: Output file path.
	:param get_all: Return all strings, translated or not."""
	clear_cache()
	apps = frappe.get_all_apps(True)

	messages = []
	untranslated = []
	for app in apps:
		messages.extend(get_messages_for_app(app))

	messages = deduplicate_messages(messages)

	def escape_newlines(s):
		return (s.replace("\\\n", "|||||")
				.replace("\\n", "||||")
				.replace("\n", "|||"))

	if get_all:
		print(str(len(messages)) + " messages")
		with open(untranslated_file, "wb") as f:
			for m in messages:
				# replace \n with ||| so that internal linebreaks don't get split
				f.write((escape_newlines(m[1]) + os.linesep).encode("utf-8"))
	else:
		full_dict = get_full_dict(lang)

		for m in messages:
			if not full_dict.get(m[1]):
				untranslated.append(m[1])

		if untranslated:
			print(str(len(untranslated)) + " missing translations of " + str(len(messages)))
			with open(untranslated_file, "wb") as f:
				for m in untranslated:
					# replace \n with ||| so that internal linebreaks don't get split
					f.write((escape_newlines(m) + os.linesep).encode("utf-8"))
		else:
			print("all translated!")

def update_translations(lang, untranslated_file, translated_file):
	"""Update translations from a source and target file for a given language.

	:param lang: Language code (e.g. `en`).
	:param untranslated_file: File path with the messages in English.
	:param translated_file: File path with messages in language to be updated."""
	clear_cache()
	full_dict = get_full_dict(lang)

	def restore_newlines(s):
		return (s.replace("|||||", "\\\n")
				.replace("| | | | |", "\\\n")
				.replace("||||", "\\n")
				.replace("| | | |", "\\n")
				.replace("|||", "\n")
				.replace("| | |", "\n"))

	translation_dict = {}
	for key, value in zip(frappe.get_file_items(untranslated_file, ignore_empty_lines=False),
		frappe.get_file_items(translated_file, ignore_empty_lines=False)):

		# undo hack in get_untranslated
		translation_dict[restore_newlines(key)] = restore_newlines(value)

	full_dict.update(translation_dict)

	for app in frappe.get_all_apps(True):
		write_translations_file(app, lang, full_dict)

def import_translations(lang, path):
	"""Import translations from file in standard format"""
	clear_cache()
	full_dict = get_full_dict(lang)
	full_dict.update(get_translation_dict_from_file(path, lang, 'import'))

	for app in frappe.get_all_apps(True):
		write_translations_file(app, lang, full_dict)


def rebuild_all_translation_files():
	"""Rebuild all translation files: `[app]/translations/[lang].csv`."""
	for lang in get_all_languages():
		for app in frappe.get_all_apps():
			write_translations_file(app, lang)

def write_translations_file(app, lang, full_dict=None, app_messages=None):
	"""Write a translation file for a given language.

	:param app: `app` for which translations are to be written.
	:param lang: Language code.
	:param full_dict: Full translated language dict (optional).
	:param app_messages: Source strings (optional).
	"""
	if not app_messages:
		app_messages = get_messages_for_app(app)

	if not app_messages:
		return

	tpath = frappe.get_pymodule_path(app, "translations")
	frappe.create_folder(tpath)
	write_csv_file(os.path.join(tpath, lang + ".csv"),
		app_messages, full_dict or get_full_dict(lang))

def send_translations(translation_dict):
	"""Append translated dict in `frappe.local.response`"""
	if "__messages" not in frappe.local.response:
		frappe.local.response["__messages"] = {}

	frappe.local.response["__messages"].update(translation_dict)

def deduplicate_messages(messages):
	ret = []
	op = operator.itemgetter(1)
	messages = sorted(messages, key=op)
	for k, g in itertools.groupby(messages, op):
		ret.append(next(g))
	return ret

def get_bench_dir():
	return os.path.join(frappe.__file__, '..', '..', '..', '..')

def rename_language(old_name, new_name):
	if not frappe.db.exists('Language', new_name):
		return

	language_in_system_settings = frappe.db.get_single_value("System Settings", "language")
	if language_in_system_settings == old_name:
		frappe.db.set_value("System Settings", "System Settings", "language", new_name)

	frappe.db.sql("""update `tabUser` set language=%(new_name)s where language=%(old_name)s""",
		{ "old_name": old_name, "new_name": new_name })

@frappe.whitelist()
def update_translations_for_source(source=None, translation_dict=None):
	if not (source and translation_dict):
		return

	translation_dict = json.loads(translation_dict)

	# for existing records
	translation_records = frappe.db.get_values('Translation', {
		'source_text': source
	}, ['name', 'language'],  as_dict=1)
	for d in translation_records:
		if translation_dict.get(d.language, None):
			doc = frappe.get_doc('Translation', d.name)
			doc.translated_text = translation_dict.get(d.language)
			doc.save()
			# done with this lang value
			translation_dict.pop(d.language)
		else:
			frappe.delete_doc('Translation', d.name)

	# remaining values are to be inserted
	for lang, translated_text in iteritems(translation_dict):
		doc = frappe.new_doc('Translation')
		doc.language = lang
		doc.source_text = source
		doc.translated_text = translated_text
		doc.save()

	return translation_records

@frappe.whitelist()
def get_translations(source_text):
	if is_html(source_text):
		source_text = strip_html_tags(source_text)

	return frappe.db.get_list('Translation',
		fields = ['name', 'language', 'translated_text as translation'],
		filters = {
			'source_text': source_text
		}
	)

@frappe.whitelist()
def get_messages(language, start=0, page_length=100, search_text=''):
	from frappe.frappeclient import FrappeClient
	translator = FrappeClient(get_translator_url())
	translated_dict = translator.post_api('translator.api.get_strings_for_translation', params=locals())

	return translated_dict


@frappe.whitelist()
def get_source_additional_info(source, language=''):
	from frappe.frappeclient import FrappeClient
	translator = FrappeClient(get_translator_url())
	return translator.post_api('translator.api.get_source_additional_info', params=locals())

@frappe.whitelist()
def get_contributions(language):
	return frappe.get_all('Translation', fields=['*'], filters={
		'contributed': 1,
	})

@frappe.whitelist()
def get_contribution_status(message_id):
	from frappe.frappeclient import FrappeClient
	doc = frappe.get_doc('Translation', message_id)
	translator = FrappeClient(get_translator_url())
	contributed_translation = translator.get_api('translator.api.get_contribution_status', params={
		'translation_id': doc.contribution_docname
	})
	return contributed_translation

def get_translator_url():
	return frappe.get_hooks()['translator_url'][0]

@frappe.whitelist(allow_guest=True)
def get_all_languages(with_language_name=False):
	"""Returns all language codes ar, ch etc"""
	def get_language_codes():
		return frappe.db.sql_list('select name from tabLanguage')

	def get_all_language_with_name():
		return frappe.db.get_all('Language', ['language_code', 'language_name'])

	if not frappe.db:
		frappe.connect()

	if with_language_name:
		return frappe.cache().get_value('languages_with_name', get_all_language_with_name)
	else:
		return frappe.cache().get_value('languages', get_language_codes)

@frappe.whitelist(allow_guest=True)
def set_preferred_language_cookie(preferred_language):
	frappe.local.cookie_manager.set_cookie("preferred_language", preferred_language)
