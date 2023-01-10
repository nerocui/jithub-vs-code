(function () {
	/*** begin config block ***/
	const staticAssetsPath = '/static' + (window.staticHashCode ? '/' + window.staticHashCode : '');
	const staticAssetsPrefix = window.location.origin + staticAssetsPath;
	const nodeModulesPrefix = staticAssetsPrefix + '/node_modules';

	Object.keys(self.webPackagePaths).forEach((key) => {
		self.webPackagePaths[key] = `${nodeModulesPrefix}/${key}/${self.webPackagePaths[key]}`;
	});
	// config vscode loader
	if (window.require && window.require.config) {
		window.require.config({
			baseUrl: staticAssetsPrefix + '/vscode',
			paths: self.webPackagePaths,
		});
	}

	// set workbench config
	let scheme = 'github1s';
	let platformName = 'GitHub';

	const searches = window.location.search.substring(1).split('&');
	const searchDict = {};
	searches.forEach((value) => {
		const items = value.split('=');
		try {
			searchDict[items[0]] = items[1];
		} catch {}
	});

	const repository = `${searchDict['owner']}/${searchDict['repo']}`;
	const theme = searchDict['theme'];
	const defaultTheme = theme && theme === 'dark' ? 'Default Dark+' : 'Default Light+';

	// set product.json
	const productConfiguration = {
		nameShort: platformName,
		nameLong: platformName,
		applicationName: platformName,
		reportIssueUrl: 'https://github.com/nerocui/JitHubFeedback/issues/new',
		extensionsGallery: {
			serviceUrl: 'https://marketplace.visualstudio.com/_apis/public/gallery',
			cacheUrl: 'https://vscode.blob.core.windows.net/gallery/index',
			itemUrl: 'https://marketplace.visualstudio.com/items',
			resourceUrlTemplate: window.location.origin + '/api/vscode-unpkg/{publisher}/{name}/{version}/{path}',
			controlUrl: 'https://az764295.vo.msecnd.net/extensions/marketplace.json',
			recommendationsUrl: 'https://az764295.vo.msecnd.net/extensions/workspaceRecommendations.json.gz',
		},
		linkProtectionTrustedDomains: [
			'*.github.com',
			'*.jithub.com',
			'*.gitlab.com',
			'*.gitlab1s.com',
			'*.bitbucket.org',
			'*.bitbucket1s.org',
			'*.npmjs.com',
			'*.npmjs1s.com',
			'*.microsoft.com',
			'*.vercel.com',
			'*.sourcegraph.com',
			'*.gitpod.io',
		],
	};
	/*** end config block ***/

	/*** begin connect to github block ***/
	// resolves with `{ access_token: string; token_type?: string; scope?: string } | { error: string; error_description: string; }`
	const ConnectToGitHub = () => {
		const GITHUB_AUTH_URL =
			'https://github.com/login/oauth/authorize?scope=repo,user:email&client_id=eae6621348403ea49103';
		const OPEN_WINDOW_FEATURES =
			'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=800,height=520,top=150,left=150';
		const AUTH_PAGE_ORIGIN = 'https://auth.github1s.com';
		const opener = window.open(GITHUB_AUTH_URL, '_blank', OPEN_WINDOW_FEATURES);
		const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

		return new Promise((resolve) => {
			const handleAuthMessage = (event) => {
				// Note that though the browser block opening window and popup a tip,
				// the user can be still open it from the tip. In this case, the `opener`
				// is null, and we should still process the authorizing message
				const isValidOpener = !!(opener && event.source === opener);
				const isValidOrigin = event.origin === AUTH_PAGE_ORIGIN;
				const isValidResponse = event.data ? event.data.type === 'authorizing' : false;
				if (!isValidOpener || !isValidOrigin || !isValidResponse) {
					return;
				}
				window.removeEventListener('message', handleAuthMessage);
				resolve(event.data.payload);
			};

			window.addEventListener('message', handleAuthMessage);
			// if there isn't any message from opener window in 300s, remove the message handler
			timeout(300 * 1000).then(() => {
				window.removeEventListener('message', handleAuthMessage);
				resolve({ error: 'authorizing_timeout', error_description: 'Authorizing timeout' });
			});
		});
	};
	/*** end connect to github block ***/

	window.vscodeWeb = {
		windowIndicator: { label: repository },
		additionalBuiltinExtensions: [],
		webviewEndpoint: staticAssetsPrefix + '/vscode/vs/workbench/contrib/webview/browser/pre',
		webWorkerExtensionHostIframeSrc:
			staticAssetsPrefix + '/vscode/vs/workbench/services/extensions/worker/httpWebWorkerExtensionHostIframe.html',
		commands: [
			{
				id: 'github1s.commands.vscode.getBrowserUrl',
				handler() {
					return window.location.href;
				},
			},
			{
				id: 'github1s.commands.vscode.replaceBrowserUrl',
				handler(url) {
					window.history.replaceState(null, '', url);
				},
			},
			{
				id: 'github1s.commands.vscode.pushBrowserUrl',
				handler(url) {
					window.history.pushState(null, '', url);
				},
			},
			{
				id: 'github1s.commands.vscode.connectToGitHub',
				handler: ConnectToGitHub,
			},
		],
		productConfiguration: productConfiguration,
		initialColorTheme: { themeType: theme ? theme : 'dark' },
		configurationDefaults: {
			'workbench.colorTheme': defaultTheme,
			'telemetry.telemetryLevel': 'off',
			'workbench.startupEditor': 'readme',
		},
		builtinExtensions: window.github1sExtensions || [],
		folderUri: { scheme: scheme, authority: '', path: '/' },
		workspaceId: scheme + ':' + repository,
		workspaceLabel: repository,
		hideTextFileLabelDecorations: true,
	};
})();
