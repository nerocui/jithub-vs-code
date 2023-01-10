/**
 * @file parse github path
 * @author netcon
 */

import { parsePath } from 'history';
import { PageType, RouterState } from '@/adapters/types';
import { GitHub1sDataSource } from './data-source';
import * as queryString from 'query-string';
import { GitHubTokenManager } from './token';

const parseTreeUrl = async (path: string): Promise<RouterState> => {
	const pathParts = parsePath(path).pathname!.split('/').filter(Boolean);
	const [owner, repo, _pageType, ...restParts] = pathParts;
	const repoFullName = `${owner}/${repo}`;
	const dataSource = GitHub1sDataSource.getInstance();
	const { ref, path: filePath } = await dataSource.extractRefPath(repoFullName, restParts.join('/'));

	return { pageType: PageType.Tree, repo: repoFullName, ref, filePath };
};

const parseBlobUrl = async (path: string): Promise<RouterState> => {
	const routerState = (await parseTreeUrl(path)) as any;
	const { hash: routerHash } = parsePath(path);

	if (!routerHash) {
		return { ...routerState, pageType: PageType.Blob };
	}

	// get selected line number range from path which looks like:
	// `/conwnet/github1s/blob/HEAD/package.json#L10-L20`
	const matches = routerHash.match(/^#L(\d+)(?:-L(\d+))?/);
	const [_, startLineNumber = '0', endLineNumber] = matches ? matches : [];

	return {
		...routerState,
		pageType: PageType.Blob,
		startLine: parseInt(startLineNumber, 10),
		endLine: parseInt(endLineNumber || startLineNumber, 10),
	};
};

const parseCommitsUrl = async (path: string): Promise<RouterState> => {
	const pathParts = parsePath(path).pathname!.split('/').filter(Boolean);
	const [owner, repo, _pageType, ...refParts] = pathParts;

	return {
		repo: `${owner}/${repo}`,
		pageType: PageType.CommitList,
		ref: refParts.length ? refParts.join('/') : 'HEAD',
	};
};

const parseCommitUrl = async (path: string): Promise<RouterState> => {
	const pathParts = parsePath(path).pathname!.split('/').filter(Boolean);
	const [owner, repo, _pageType, ...refParts] = pathParts;
	const commitSha = refParts.join('/');

	return { repo: `${owner}/${repo}`, pageType: PageType.Commit, ref: commitSha, commitSha };
};

const parsePullsUrl = async (path: string): Promise<RouterState> => {
	const [owner, repo] = parsePath(path).pathname!.split('/').filter(Boolean);

	return {
		repo: `${owner}/${repo}`,
		ref: 'HEAD',
		pageType: PageType.CodeReviewList,
	};
};

const parsePullUrl = async (path: string): Promise<RouterState> => {
	const pathParts = parsePath(path).pathname!.split('/').filter(Boolean);
	const [owner, repo, _pageType, codeReviewId] = pathParts;
	const repoFullName = `${owner}/${repo}`;
	const codeReview = await GitHub1sDataSource.getInstance().provideCodeReview(repoFullName, codeReviewId);

	return {
		repo: `${owner}/${repo}`,
		pageType: PageType.CodeReview,
		ref: codeReview.base.commitSha,
		codeReviewId,
	};
};

const parseSearchUrl = async (path: string): Promise<RouterState> => {
	const { pathname, search } = parsePath(path);
	const pathParts = pathname!.split('/').filter(Boolean);
	const [owner, repo, _pageType] = pathParts;
	const queryOptions = queryString.parse(search || '');
	const query = typeof queryOptions.q === 'string' ? queryOptions.q : '';
	const isRegex = queryOptions.regex === 'yes';
	const isCaseSensitive = queryOptions.case === 'yes';
	const matchWholeWord = queryOptions.whole === 'yes';
	const filesToInclude = typeof queryOptions['files-to-include'] === 'string' ? queryOptions['files-to-include'] : '';
	const filesToExclude = typeof queryOptions['files-to-exclude'] === 'string' ? queryOptions['files-to-exclude'] : '';

	return {
		repo: `${owner}/${repo}`,
		pageType: PageType.Search,
		ref: 'HEAD',
		query,
		isRegex,
		isCaseSensitive,
		matchWholeWord,
		filesToInclude,
		filesToExclude,
	};
};

const PAGE_TYPE_MAP = {
	tree: PageType.Tree,
	blob: PageType.Blob,
	pulls: PageType.CodeReviewList,
	pull: PageType.CodeReview,
	commit: PageType.Commit,
	commits: PageType.CommitList,
	search: PageType.Search,
};

export const buildQueries = (url: string | undefined) => {
	if (!url) {
		return null;
	}
	try {
		const queryPart = url.split('?')[1];
		const queries = {};
		const queriesSplits = queryPart.split('&');
		for (let i = 0; i < queriesSplits.length; i++) {
			const query = queriesSplits[i];
			const querySplit = query.split('=');
			queries[querySplit[0]] = querySplit[1];
		}
		return queries;
	} catch (_e) {
		return null;
	}
};

export const queriesToUrlSearch = (queries: any): string => {
	const arr: string[] = [];
	for (const [key, value] of Object.entries(queries)) {
		arr.push(`${key}=${value}`);
	}
	const search = arr.join('&');
	return `?${search}`;
};

export const parseGitHubPath = async (path: string): Promise<RouterState> => {
	const queries = buildQueries(parsePath(path).search);

	if (!!queries && !!queries['token']) {
		GitHubTokenManager.getInstance().setToken(queries['token']);
	}

	if (!!queries && queries['type'] === 'blob') {
		return {
			pageType: PageType.Blob,
			repo:
				!!queries['owner'] && !!queries['repo'] ? `${queries['owner']}/${queries['repo']}` : 'nerocui/JitHubFeedback',
			ref: !!queries['ref'] ? queries['ref'] : 'HEAD',
			filePath: !!queries['filePath'] ? queries['filePath'] : '',
		};
	} else if (!!queries) {
		return {
			pageType: PageType.Tree,
			repo:
				!!queries['owner'] && !!queries['repo'] ? `${queries['owner']}/${queries['repo']}` : 'nerocui/JitHubFeedback',
			ref: !!queries['ref'] ? queries['ref'] : 'HEAD',
			filePath: !!queries['filePath'] ? queries['filePath'] : '',
		};
	} else {
		return {
			pageType: PageType.Tree,
			repo: 'nerocui/JitHubFeedback',
			ref: 'HEAD',
			filePath: '',
		};
	}
};
