/**
 * @file router parser
 * @author netcon
 */

import * as adapterTypes from '../types';
import { parseGitHubPath, queriesToUrlSearch } from './parse-path';

export class GitHub1sRouterParser extends adapterTypes.RouterParser {
	private static instance: GitHub1sRouterParser | null = null;

	public static getInstance(): GitHub1sRouterParser {
		if (GitHub1sRouterParser.instance) {
			return GitHub1sRouterParser.instance;
		}
		return (GitHub1sRouterParser.instance = new GitHub1sRouterParser());
	}

	parsePath(path: string): Promise<adapterTypes.RouterState> {
		return parseGitHubPath(path);
	}

	buildTreePath(repo: string, ref?: string, filePath?: string): string {
		const queries = {};
		const repoSplits = repo.split('/');
		queries['owner'] = repoSplits[0];
		queries['repo'] = repoSplits[1];
		if (!!ref) {
			queries['ref'] = ref;
			queries['type'] = 'tree';
		}
		if (!!filePath) {
			queries['filePath'] = filePath;
		}
		return queriesToUrlSearch(queries);
	}

	buildBlobPath(repo: string, ref: string, filePath: string, startLine?: number, endLine?: number): string {
		const queries = {};
		const repoSplits = repo.split('/');
		queries['owner'] = repoSplits[0];
		queries['repo'] = repoSplits[1];
		queries['type'] = 'blob';
		if (!!ref) {
			queries['ref'] = ref;
		}
		if (!!filePath) {
			queries['filePath'] = filePath;
		}
		return queriesToUrlSearch(queries);
	}

	buildCommitListPath(repo: string): string {
		return `/${repo}/commits`;
	}

	buildCommitPath(repo: string, commitSha: string): string {
		return `/${repo}/commit/${commitSha}`;
	}

	buildCodeReviewListPath(repo: string): string {
		return `/${repo}/pulls`;
	}

	buildCodeReviewPath(repo: string, codeReviewId: string): string {
		return `/${repo}/pull/${codeReviewId}`;
	}

	buildExternalLink(path: string): string {
		return 'https://github.com' + (path.startsWith('/') ? path : `/${path}`);
	}
}
