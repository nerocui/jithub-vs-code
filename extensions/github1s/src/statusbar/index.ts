/**
 * @file decorate footer
 * @author netcon
 */

import { updateCheckoutTo } from './checkout';
import { showGitpod } from './gitpod';
import { showSponsors } from './sponsors';

export const decorateStatusBar = () => {
	//don't show sponsors in JitHub
	//showSponsors().then(() => showGitpod());
	updateCheckoutTo();
};
