import RouteNode  from 'route-node';
import withUtils from './core/utils';
import withRouterLifecycle from './core/router-lifecycle';
import withNavigation from './core/navigation';
import withMiddleware from './core/middleware';
import withPlugins from './core/plugins';
import withRouteLifecycle from './core/route-lifecycle';
import constants from './constants';

const defaultOptions = {
    trailingSlash: 0,
    autoCleanUp: true,
    strictQueryParams: true,
    allowNotFound: false
};

function createRouter(routes, opts) {
    let routerState = null;
    const callbacks = {};
    const dependencies = {};
    const options = { ...defaultOptions, ...opts };

    const router = {
        rootNode,
        getOptions,
        setOption,
        getState,
        setState,
        makeState,
        makeNotFoundState,
        setDependency,
        setDependencies,
        getDependencies,
        add,
        addNode,
        executeFactory,
        addListener,
        removeListener,
        invokeListeners
    };

    function invokeListeners(eventName, ...args) {
        (callbacks[eventName] || []).forEach(cb => cb(...args));
    }

    function removeListener(eventName, cb) {
        callbacks[eventName] = callbacks[eventName].filter((_cb) => _cb !== cb);
    }

    function addListener(eventName, cb) {
        callbacks[eventName] = (callbacks[eventName] || []).concat(cb);

        return () => removeListener(eventName, cb);
    }

    withUtils(router);
    withPlugins(router);
    withMiddleware(router);
    withRouteLifecycle(router);
    withRouterLifecycle(router);
    withNavigation(router);

    const rootNode  = routes instanceof RouteNode
        ? routes
        : new RouteNode('', '', routes, addCanActivate);

    router.rootNode = rootNode;

    return router;

    function addCanActivate(route) {
        if (route.canActivate) router.canActivate(route.name, route.canActivate);
    }

    function makeState(name, params, path, metaParams, source) {
        const state = {};
        const setProp = (key, value) => Object.defineProperty(state, key, { value, enumerable: true });
        setProp('name', name);
        setProp('params', params);
        setProp('path', path);
        if (metaParams || source) {
            const meta = { params: metaParams };

            if (source) meta.source = source;

            setProp('meta', meta);
        }
        return state;
    }

    function makeNotFoundState(path) {
        return makeState(constants.UNKNOWN_ROUTE, { path }, path, {});
    }

    function getState() {
        return routerState;
    }

    function setState(state) {
        routerState = state;
    }

    function getOptions() {
        return options;
    }

    function setOption(option, value) {
        options[option] = value;
        return router;
    }

    function setDependency(dependencyName, dependency) {
        dependencies[dependencyName] = dependency;
        return router;
    }

    function setDependencies(deps) {
        Object.keys(deps).forEach((depName) => {
            dependencies[depName] = deps[depName];
        });
    }

    function getDependencies() {
        return dependencies;
    }

    function getInjectables() {
        return [ router, dependencies ];
    }

    function executeFactory(factoryFunction) {
        return factoryFunction(...getInjectables());
    }

    function add(routes) {
        rootNode.add(routes, addCanActivate);
        return router;
    }

    function addNode(name, path, canActivateHandler) {
        rootNode.addNode(name, path);
        if (canActivateHandler) router.canActivate(name, canActivateHandler);
        return router;
    }
}

export default createRouter;
