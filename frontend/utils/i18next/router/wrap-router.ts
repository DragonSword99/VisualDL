/*
  This `Router` is a wrap of the standard
  NextJs `Router`, with some simple lang
  redirect logic in place.

  If you haven't already, read this issue comment:
  https://github.com/zeit/next.js/issues/2833#issuecomment-414919347

  Very important: if you import `Router` from NextJs directly,
  and not this file, your lang subpath routing will break.
*/
import NextRouter, {SingletonRouter} from 'next/router';
import {lngPathCorrector, subpathIsRequired} from '../utils';

const propertyFields = ['pathname', 'route', 'query', 'asPath', 'components', 'events'];
const coreMethods = ['reload', 'back', 'beforePopState', 'ready', 'prefetch'];
const wrappedMethods = ['push', 'replace'];

export const wrapRouter = (nextI18NextInternals: any) => {
    const Router = {} as SingletonRouter;

    propertyFields.forEach(field => {
        Object.defineProperty(Router, field, {
            get() {
                return (NextRouter as any)[field];
            }
        });
    });

    coreMethods.forEach(method => {
        (Router as any)[method] = (...args: any[]) => (NextRouter as any)[method](...args);
    });

    wrappedMethods.forEach(method => {
        (Router as any)[method] = (path: string, as: any, options: any) => {
            const {config, i18n} = nextI18NextInternals;

            if (subpathIsRequired(config, i18n.languages[0])) {
                const {as: correctedAs, href: correctedHref} = lngPathCorrector(
                    config,
                    {as, href: path},
                    i18n.languages[0]
                );

                return (NextRouter as any)[method](correctedHref, correctedAs, options);
            }

            return (NextRouter as any)[method](path, as, options);
        };
    });

    return Router;
};
