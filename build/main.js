require('source-map-support/register')
module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(6);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("mongorito");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("joi");

/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_joi__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_joi___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_joi__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_talisman_metrics_distance_dice__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_talisman_metrics_distance_dice___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_talisman_metrics_distance_dice__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_talisman_metrics_distance_eudex__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_talisman_metrics_distance_eudex___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_talisman_metrics_distance_eudex__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_talisman_metrics_distance_jaro_winkler__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_talisman_metrics_distance_jaro_winkler___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_talisman_metrics_distance_jaro_winkler__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_talisman_metrics_distance_mra__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_talisman_metrics_distance_mra___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_talisman_metrics_distance_mra__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_talisman_metrics_distance_levenshtein__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_talisman_metrics_distance_levenshtein___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_talisman_metrics_distance_levenshtein__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__errors_js__ = __webpack_require__(16);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }









var InvalidSchemaError = __WEBPACK_IMPORTED_MODULE_6__errors_js__["a" /* default */].InvalidSchemaError;

var Utils = function () {
  function Utils() {
    _classCallCheck(this, Utils);
  }

  _createClass(Utils, null, [{
    key: 'getContentAsJSON',

    /*
      Convert a buffer typed rabbitmq message to JSON object
    */
    value: function getContentAsJSON(message) {
      try {
        var content = message.content;
        var properties = message.properties;


        content = JSON.parse(content.toString());
        return {
          content: content,
          properties: properties
        };
      } catch (error) {
        throw error;
      }
    }

    /*
      Validate json schema
    */

  }, {
    key: 'validateSchema',
    value: function validateSchema(data, schema) {
      try {
        var _Joi$validate = __WEBPACK_IMPORTED_MODULE_0_joi___default.a.validate(data, schema),
            error = _Joi$validate.error;

        if (error) {
          throw new InvalidSchemaError(schema, data, error);
        }
      } catch (error) {
        throw error;
      }
    }

    /*
      Check similarity between two string
    */

  }, {
    key: 'similarityCalculation',
    value: function similarityCalculation(from, to) {
      console.log('-= Calculating similarity =-');
      console.log('entity_from: ' + from);
      console.log('entity_to: ' + to);
      // const eudexValue = isSimilar(from, to); // similar
      var diceValue = Object(__WEBPACK_IMPORTED_MODULE_1_talisman_metrics_distance_dice__["similarity"])(from, to); // similar
      // const mraValue = mra(from, to); // similar
      var jaroWinklerValue = __WEBPACK_IMPORTED_MODULE_3_talisman_metrics_distance_jaro_winkler___default()(from, to); // distance
      var levenshteinValue = __WEBPACK_IMPORTED_MODULE_5_talisman_metrics_distance_levenshtein___default()(from, to); // metric distance
      // console.log(`eudex: ${eudexValue}`);
      console.log('dice: ' + diceValue);
      // console.log(`mra: match: ${mraValue.matching}, value: ${mraValue.similarity}`);
      // console.log(`jarowWinkler: ${jaroWinklerValue}`);
      // console.log(`levenshtein: ${levenshteinValue}`);
      return {
        dice: diceValue,
        //mra: mraValue,
        jaroWinkler: jaroWinklerValue,
        levenshtein: levenshteinValue
      };
    }

    /*
      Construct a similarity info object
    */

  }, {
    key: 'similarityType',
    value: function similarityType(type, entity) {
      var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      return {
        type: type,
        entity: entity,
        data: data
      };
    }
  }]);

  return Utils;
}();

/* harmony default export */ __webpack_exports__["a"] = (Utils);

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(5);


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_dotenv__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_dotenv___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_dotenv__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_amqplib__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_amqplib___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_amqplib__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_mongorito__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_mongorito___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_mongorito__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_mongorito_timestamps__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_mongorito_timestamps___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_mongorito_timestamps__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_raven__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_raven___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_raven__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_joi__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_joi___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6_joi__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__utils_js__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__match_js__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__league_js__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__team_js__ = __webpack_require__(19);


/*
  Db
 */
var initDbConnection = function () {
  var _ref = _asyncToGenerator(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.mark(function _callee() {
    var db;
    return __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            db = new __WEBPACK_IMPORTED_MODULE_3_mongorito__["Database"](process.env.MONGODB_URI);
            // connect

            _context.next = 3;
            return db.connect();

          case 3:

            // plugin
            db.use(__WEBPACK_IMPORTED_MODULE_4_mongorito_timestamps___default()());
            // registering model
            db.register(__WEBPACK_IMPORTED_MODULE_8__match_js__["a" /* default */].model);
            db.register(__WEBPACK_IMPORTED_MODULE_10__team_js__["a" /* default */].model);
            db.register(__WEBPACK_IMPORTED_MODULE_9__league_js__["a" /* default */].model);

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function initDbConnection() {
    return _ref.apply(this, arguments);
  };
}();

var initRabbitMQConnection = function () {
  var _ref2 = _asyncToGenerator(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.mark(function _callee2() {
    var connection, channel;
    return __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return __WEBPACK_IMPORTED_MODULE_2_amqplib___default.a.connect(process.env.RABBITMQ_URI);

          case 2:
            connection = _context2.sent;
            _context2.next = 5;
            return connection.createChannel();

          case 5:
            channel = _context2.sent;
            _context2.next = 8;
            return channel.assertQueue(QueueTypes.CREATE_MATCH);

          case 8:
            _context2.next = 10;
            return channel.assertQueue(QueueTypes.FAILED_MATCH);

          case 10:
            _context2.next = 12;
            return channel.prefetch(1);

          case 12:
            return _context2.abrupt('return', channel);

          case 13:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function initRabbitMQConnection() {
    return _ref2.apply(this, arguments);
  };
}();

/*
  Entry
 */


var main = function () {
  var _ref3 = _asyncToGenerator(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.mark(function _callee4() {
    var _this = this;

    var channel;
    return __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return initDbConnection();

          case 2:
            _context4.next = 4;
            return initRabbitMQConnection();

          case 4:
            channel = _context4.sent;


            /*
              Consumers
            */
            channel.consume(QueueTypes.CREATE_MATCH, function () {
              var _ref4 = _asyncToGenerator(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.mark(function _callee3(message) {
                var _Utils$getContentAsJS, matchData, homeTeam, awayTeam, league, game, date, matchId, gameId, leagueService, _ref5, leagueUnique, leagueId, homeTeamService, _ref6, homeTeamUnique, homeTeamId, awayTeamService, _ref7, awayTeamUnique, awayTeamId;

                return __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.prev = 0;
                        _Utils$getContentAsJS = __WEBPACK_IMPORTED_MODULE_7__utils_js__["a" /* default */].getContentAsJSON(message), matchData = _Utils$getContentAsJS.content;


                        console.log(matchData);

                        if (process.env.VALIDATE_BASE === 'true') {
                          __WEBPACK_IMPORTED_MODULE_7__utils_js__["a" /* default */].validateSchema(matchData, schema);
                        }

                        homeTeam = matchData.homeTeam, awayTeam = matchData.awayTeam, league = matchData.league, game = matchData.game, date = matchData.date;
                        matchId = '';
                        gameId = '';

                        /*
                          League
                        */

                        leagueService = new __WEBPACK_IMPORTED_MODULE_9__league_js__["a" /* default */](league, {
                          validate: true,
                          algoCheck: true
                        });
                        _context3.next = 10;
                        return leagueService.init();

                      case 10:
                        _context3.next = 12;
                        return leagueService.similarityCheck();

                      case 12:
                        _ref5 = _context3.sent;
                        leagueUnique = _ref5.unique;
                        leagueId = _ref5.id;


                        /*
                          Team
                        */

                        homeTeamService = new __WEBPACK_IMPORTED_MODULE_10__team_js__["a" /* default */](homeTeam, {
                          validate: true,
                          algoCheck: true
                        });
                        _context3.next = 18;
                        return homeTeamService.init();

                      case 18:
                        _context3.next = 20;
                        return homeTeamService.similarityCheck();

                      case 20:
                        _ref6 = _context3.sent;
                        homeTeamUnique = _ref6.unique;
                        homeTeamId = _ref6.id;
                        awayTeamService = new __WEBPACK_IMPORTED_MODULE_10__team_js__["a" /* default */](awayTeam, {
                          validate: true,
                          algoCheck: true
                        });
                        _context3.next = 26;
                        return awayTeamService.init();

                      case 26:
                        _context3.next = 28;
                        return homeTeamService.similarityCheck();

                      case 28:
                        _ref7 = _context3.sent;
                        awayTeamUnique = _ref7.unique;
                        awayTeamId = _ref7.id;


                        console.log('leagueunique: ' + leagueUnique);
                        console.log('hometeamunique: ' + homeTeamUnique);
                        console.log('awayteamunique: ' + awayTeamUnique);

                        //return channel.ack(message);
                        _context3.next = 40;
                        break;

                      case 36:
                        _context3.prev = 36;
                        _context3.t0 = _context3['catch'](0);

                        __WEBPACK_IMPORTED_MODULE_5_raven___default.a.captureException(_context3.t0);
                        return _context3.abrupt('return', channel.nack(message));

                      case 40:
                      case 'end':
                        return _context3.stop();
                    }
                  }
                }, _callee3, _this, [[0, 36]]);
              }));

              return function (_x) {
                return _ref4.apply(this, arguments);
              };
            }());

          case 6:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function main() {
    return _ref3.apply(this, arguments);
  };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }












var schema = __WEBPACK_IMPORTED_MODULE_6_joi___default.a.object().keys({
  homeTeam: __WEBPACK_IMPORTED_MODULE_6_joi___default.a.string().required(),
  awayTeam: __WEBPACK_IMPORTED_MODULE_6_joi___default.a.string().required(),
  league: __WEBPACK_IMPORTED_MODULE_6_joi___default.a.string().required(),
  game: __WEBPACK_IMPORTED_MODULE_6_joi___default.a.string().required(),
  date: __WEBPACK_IMPORTED_MODULE_6_joi___default.a.string().isoDate().required()
});

__WEBPACK_IMPORTED_MODULE_1_dotenv___default.a.config();

__WEBPACK_IMPORTED_MODULE_5_raven___default.a.config(process.env.SENTRY_DSN).install();

/*
  Queue declarations
 */
var QueueTypes = {
  CREATE_MATCH: 'matches',
  FAILED_MATCH: 'failed_matches'
};

main();

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("regenerator-runtime");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("dotenv");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("amqplib");

/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("mongorito-timestamps");

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = require("raven");

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("talisman/metrics/distance/dice");

/***/ }),
/* 12 */
/***/ (function(module, exports) {

module.exports = require("talisman/metrics/distance/eudex");

/***/ }),
/* 13 */
/***/ (function(module, exports) {

module.exports = require("talisman/metrics/distance/jaro-winkler");

/***/ }),
/* 14 */
/***/ (function(module, exports) {

module.exports = require("talisman/metrics/distance/mra");

/***/ }),
/* 15 */
/***/ (function(module, exports) {

module.exports = require("talisman/metrics/distance/levenshtein");

/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AppError = function (_Error) {
  _inherits(AppError, _Error);

  function AppError(message) {
    _classCallCheck(this, AppError);

    // stacktrace saving
    var _this = _possibleConstructorReturn(this, (AppError.__proto__ || Object.getPrototypeOf(AppError)).call(this, message));
    // error constructor call.


    Error.captureStackTrace(_this, _this.constructor);

    // just in case we save name of class too
    _this.name = _this.constructor.name;
    return _this;
  }

  return AppError;
}(Error);

var InvalidSchemaError = function (_Error2) {
  _inherits(InvalidSchemaError, _Error2);

  function InvalidSchemaError(schema, data, error) {
    _classCallCheck(this, InvalidSchemaError);

    var _this2 = _possibleConstructorReturn(this, (InvalidSchemaError.__proto__ || Object.getPrototypeOf(InvalidSchemaError)).call(this, schema + ' schema validation failed with error: ' + error));

    _this2.schema = schema;
    _this2.data = data;
    _this2.error = error;
    return _this2;
  }

  return InvalidSchemaError;
}(Error);

var UnknownCorrelationIdError = function (_AppError) {
  _inherits(UnknownCorrelationIdError, _AppError);

  function UnknownCorrelationIdError() {
    var correlationId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, UnknownCorrelationIdError);

    var _this3 = _possibleConstructorReturn(this, (UnknownCorrelationIdError.__proto__ || Object.getPrototypeOf(UnknownCorrelationIdError)).call(this, 'Correlation Id\'s not found'));

    _this3.correlationId = correlationId;
    _this3.type = type;
    return _this3;
  }

  return UnknownCorrelationIdError;
}(AppError);

// class ThresholdInvalidError extends AppError {
//   constructor(threshold = null) {
//     super('Threshold\'s invalid');

//     this.threshold = threshold;
//   }
// }

// class KeywordInvalidError extends AppError {
//   constructor(keyword = null) {
//     super('Keyword\'s invalid');

//     this.keyword = keyword;
//   }
// }

// class KeywordDuplicationError extends AppError {
//   constructor(keyword = null) {
//     super('Keyword\'s already submitted');

//     this.keyword = keyword;
//   }
// }

/* harmony default export */ __webpack_exports__["a"] = ({
  UnknownCorrelationIdError: UnknownCorrelationIdError,
  InvalidSchemaError: InvalidSchemaError
});

/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_mongorito__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_mongorito___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_mongorito__);


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }



var Match = function (_Model) {
  _inherits(Match, _Model);

  function Match() {
    _classCallCheck(this, Match);

    return _possibleConstructorReturn(this, (Match.__proto__ || Object.getPrototypeOf(Match)).apply(this, arguments));
  }

  _createClass(Match, null, [{
    key: 'collection',
    value: function collection() {
      return 'matches';
    }
  }]);

  return Match;
}(__WEBPACK_IMPORTED_MODULE_1_mongorito__["Model"]);

var MatchService = function () {
  function MatchService(match) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, MatchService);

    this.opts = opts;
    this.match = match;
    this.matches = null;
  }

  _createClass(MatchService, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.mark(function _callee() {
        return __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return Match.find();

              case 2:
                this.matches = _context.sent;

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function init() {
        return _ref.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: 'save',
    value: function () {
      var _ref2 = _asyncToGenerator(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.mark(function _callee2() {
        var match;
        return __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                match = this.match;
                _context2.next = 3;
                return new Match(match).save();

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function save() {
        return _ref2.apply(this, arguments);
      }

      return save;
    }()
  }], [{
    key: 'model',
    get: function get() {
      return Match;
    }
  }]);

  return MatchService;
}();

/* harmony default export */ __webpack_exports__["a"] = (MatchService);

/***/ }),
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_mongorito__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_mongorito___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_mongorito__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_joi__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_joi___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_joi__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__utils_js__ = __webpack_require__(3);


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }





var schema = __WEBPACK_IMPORTED_MODULE_2_joi___default.a.string().required();

var League = function (_Model) {
  _inherits(League, _Model);

  function League() {
    _classCallCheck(this, League);

    return _possibleConstructorReturn(this, (League.__proto__ || Object.getPrototypeOf(League)).apply(this, arguments));
  }

  _createClass(League, null, [{
    key: 'collection',
    value: function collection() {
      return 'leagues';
    }
  }]);

  return League;
}(__WEBPACK_IMPORTED_MODULE_1_mongorito__["Model"]);

var LeagueService = function () {
  function LeagueService(league) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, LeagueService);

    this.opts = opts;
    this.league = league;
    this.leagues = null;

    var _opts$validate = opts.validate,
        validate = _opts$validate === undefined ? true : _opts$validate;

    // check if we need to validate passed league data

    if (validate) {
      __WEBPACK_IMPORTED_MODULE_3__utils_js__["a" /* default */].validateSchema(league, schema);
    }
  }

  _createClass(LeagueService, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.mark(function _callee() {
        return __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return League.find();

              case 2:
                this.leagues = _context.sent;

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function init() {
        return _ref.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: 'save',
    value: function () {
      var _ref2 = _asyncToGenerator(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.mark(function _callee2() {
        var name;
        return __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                name = this.league;
                _context2.next = 3;
                return new League({
                  name: name
                }).save();

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function save() {
        return _ref2.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: 'setState',
    value: function setState() {
      var unique = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      this.state = {
        unique: unique,
        id: id
      };
    }
  }, {
    key: 'similarityCheck',
    value: function () {
      var _ref3 = _asyncToGenerator(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.mark(function _callee3() {
        var leagues, leaguenameToCheck, _opts$algoCheck, algoCheck, relatedLeagues, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, league, _ref4, leagueIdInDb, leaguenameInDb, strictlyEquals, _Utils$similarityCalc, diceValue, levenshteinValue, isMatchByStrict, _id, sortBySimiliarity, id;

        return __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                leagues = this.leagues;
                leaguenameToCheck = this.league;
                _opts$algoCheck = this.opts.algoCheck, algoCheck = _opts$algoCheck === undefined ? true : _opts$algoCheck;

                if (!(leagues.length === 0)) {
                  _context3.next = 6;
                  break;
                }

                this.setState();
                return _context3.abrupt('return', this.state);

              case 6:
                relatedLeagues = [];

                // we check similarity with every entity in db

                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context3.prev = 10;
                _iterator = leagues[Symbol.iterator]();

              case 12:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                  _context3.next = 25;
                  break;
                }

                league = _step.value;
                _context3.next = 16;
                return league.get();

              case 16:
                _ref4 = _context3.sent;
                leagueIdInDb = _ref4._id;
                leaguenameInDb = _ref4.name;
                // eslint-disable-line

                strictlyEquals = leaguenameInDb === leaguenameToCheck;

                // strictly equal

                if (strictlyEquals) {
                  relatedLeagues.push(__WEBPACK_IMPORTED_MODULE_3__utils_js__["a" /* default */].similarityType('strict', leaguenameInDb, {
                    id: new __WEBPACK_IMPORTED_MODULE_1_mongorito__["ObjectId"](leagueIdInDb)
                  }));
                }

                if (algoCheck && !strictlyEquals) {
                  _Utils$similarityCalc = __WEBPACK_IMPORTED_MODULE_3__utils_js__["a" /* default */].similarityCalculation(leaguenameInDb, leaguenameToCheck), diceValue = _Utils$similarityCalc.dice, levenshteinValue = _Utils$similarityCalc.levenshtein;


                  if (diceValue >= 0.7 && levenshteinValue <= 2) {
                    // similar but char differences are between ]0,2] equal by length
                    relatedLeagues.push(__WEBPACK_IMPORTED_MODULE_3__utils_js__["a" /* default */].similarityType('algo', leaguenameInDb, {
                      similarity: diceValue,
                      distance: levenshteinValue,
                      id: new __WEBPACK_IMPORTED_MODULE_1_mongorito__["ObjectId"](leagueIdInDb)
                    }));
                  }
                }

              case 22:
                _iteratorNormalCompletion = true;
                _context3.next = 12;
                break;

              case 25:
                _context3.next = 31;
                break;

              case 27:
                _context3.prev = 27;
                _context3.t0 = _context3['catch'](10);
                _didIteratorError = true;
                _iteratorError = _context3.t0;

              case 31:
                _context3.prev = 31;
                _context3.prev = 32;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 34:
                _context3.prev = 34;

                if (!_didIteratorError) {
                  _context3.next = 37;
                  break;
                }

                throw _iteratorError;

              case 37:
                return _context3.finish(34);

              case 38:
                return _context3.finish(31);

              case 39:
                if (!(relatedLeagues.length === 0)) {
                  _context3.next = 42;
                  break;
                }

                this.setState();
                return _context3.abrupt('return', this.state);

              case 42:
                isMatchByStrict = relatedLeagues.find(function (relatedLeague) {
                  return relatedLeague.type === 'strict';
                });

                if (!isMatchByStrict) {
                  _context3.next = 47;
                  break;
                }

                _id = isMatchByStrict.data.id;


                this.setState(false, _id);
                return _context3.abrupt('return', this.state);

              case 47:
                sortBySimiliarity = relatedLeagues.sort(function (a, b) {
                  return a.data.similarity - b.data.similarity;
                });
                id = sortBySimiliarity[sortBySimiliarity.length - 1].id;


                this.setState(false, id);
                return _context3.abrupt('return', this.state);

              case 51:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[10, 27, 31, 39], [32,, 34, 38]]);
      }));

      function similarityCheck() {
        return _ref3.apply(this, arguments);
      }

      return similarityCheck;
    }()
  }], [{
    key: 'model',
    get: function get() {
      return League;
    }
  }, {
    key: 'schema',
    get: function get() {
      return schema;
    }
  }]);

  return LeagueService;
}();

/* harmony default export */ __webpack_exports__["a"] = (LeagueService);

/***/ }),
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_mongorito__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_mongorito___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_mongorito__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_joi__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_joi___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_joi__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__utils_js__ = __webpack_require__(3);


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }





var schema = __WEBPACK_IMPORTED_MODULE_2_joi___default.a.string().required();

var Team = function (_Model) {
  _inherits(Team, _Model);

  function Team() {
    _classCallCheck(this, Team);

    return _possibleConstructorReturn(this, (Team.__proto__ || Object.getPrototypeOf(Team)).apply(this, arguments));
  }

  _createClass(Team, null, [{
    key: 'collection',
    value: function collection() {
      return 'teams';
    }
  }]);

  return Team;
}(__WEBPACK_IMPORTED_MODULE_1_mongorito__["Model"]);

var TeamService = function () {
  function TeamService(team) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, TeamService);

    this.opts = opts;
    this.team = team;
    this.teams = null;

    var _opts$validate = opts.validate,
        validate = _opts$validate === undefined ? true : _opts$validate;

    // check if we need to validate passed league data

    if (validate) {
      __WEBPACK_IMPORTED_MODULE_3__utils_js__["a" /* default */].validateSchema(team, schema);
    }
  }

  _createClass(TeamService, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.mark(function _callee() {
        return __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return Team.find();

              case 2:
                this.teams = _context.sent;

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function init() {
        return _ref.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: 'save',
    value: function () {
      var _ref2 = _asyncToGenerator(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.mark(function _callee2() {
        var name;
        return __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                name = this.team;
                _context2.next = 3;
                return new Team({
                  name: name
                }).save();

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function save() {
        return _ref2.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: 'setState',
    value: function setState() {
      var unique = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      this.state = {
        unique: unique,
        id: id
      };
    }
  }, {
    key: 'similarityCheck',
    value: function () {
      var _ref3 = _asyncToGenerator(__WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.mark(function _callee3() {
        var teams, teamnameToCheck, _opts$algoCheck, algoCheck, relatedTeams, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, team, _ref4, teamIdInDb, teamnameInDb, strictlyEquals, _Utils$similarityCalc, diceValue, levenshteinValue, isMatchByStrict, _id, sortBySimiliarity, id;

        return __WEBPACK_IMPORTED_MODULE_0__Users_balikiraly_Repositories_ba_matchservice_node_modules_babel_runtime_regenerator___default.a.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                teams = this.teams;
                teamnameToCheck = this.team;
                _opts$algoCheck = this.opts.algoCheck, algoCheck = _opts$algoCheck === undefined ? true : _opts$algoCheck;

                if (!(teams.length === 0)) {
                  _context3.next = 6;
                  break;
                }

                this.setState();
                return _context3.abrupt('return', this.state);

              case 6:
                relatedTeams = [];

                // we check similarity with every entity in db

                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context3.prev = 10;
                _iterator = teams[Symbol.iterator]();

              case 12:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                  _context3.next = 25;
                  break;
                }

                team = _step.value;
                _context3.next = 16;
                return team.get();

              case 16:
                _ref4 = _context3.sent;
                teamIdInDb = _ref4._id;
                teamnameInDb = _ref4.name;
                // eslint-disable-line

                strictlyEquals = teamnameInDb === teamnameToCheck;

                // strictly equal

                if (strictlyEquals) {
                  relatedTeams.push(__WEBPACK_IMPORTED_MODULE_3__utils_js__["a" /* default */].similarityType('strict', teamnameInDb, {
                    id: new __WEBPACK_IMPORTED_MODULE_1_mongorito__["ObjectId"](teamIdInDb)
                  }));
                }

                if (algoCheck && !strictlyEquals) {
                  _Utils$similarityCalc = __WEBPACK_IMPORTED_MODULE_3__utils_js__["a" /* default */].similarityCalculation(teamnameInDb, teamnameToCheck), diceValue = _Utils$similarityCalc.dice, levenshteinValue = _Utils$similarityCalc.levenshtein;


                  if (diceValue >= 0.3) {
                    // similar but char differences are between ]0,2] equal by length
                    relatedTeams.push(__WEBPACK_IMPORTED_MODULE_3__utils_js__["a" /* default */].similarityType('algo', teamnameInDb, {
                      similarity: diceValue,
                      distance: levenshteinValue,
                      id: new __WEBPACK_IMPORTED_MODULE_1_mongorito__["ObjectId"](teamIdInDb)
                    }));
                  }
                }

              case 22:
                _iteratorNormalCompletion = true;
                _context3.next = 12;
                break;

              case 25:
                _context3.next = 31;
                break;

              case 27:
                _context3.prev = 27;
                _context3.t0 = _context3['catch'](10);
                _didIteratorError = true;
                _iteratorError = _context3.t0;

              case 31:
                _context3.prev = 31;
                _context3.prev = 32;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 34:
                _context3.prev = 34;

                if (!_didIteratorError) {
                  _context3.next = 37;
                  break;
                }

                throw _iteratorError;

              case 37:
                return _context3.finish(34);

              case 38:
                return _context3.finish(31);

              case 39:
                if (!(relatedTeams.length === 0)) {
                  _context3.next = 42;
                  break;
                }

                this.setState();
                return _context3.abrupt('return', this.state);

              case 42:
                isMatchByStrict = relatedTeams.find(function (relatedTeam) {
                  return relatedTeam.type === 'strict';
                });

                if (!isMatchByStrict) {
                  _context3.next = 47;
                  break;
                }

                _id = isMatchByStrict.data.id;


                this.setState(false, _id);
                return _context3.abrupt('return', this.state);

              case 47:
                sortBySimiliarity = relatedTeams.sort(function (a, b) {
                  return a.data.similarity - b.data.similarity;
                });

                // get higher similar team

                id = sortBySimiliarity[sortBySimiliarity.length - 1].data.id;


                this.setState(false, id);
                return _context3.abrupt('return', this.state);

              case 51:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[10, 27, 31, 39], [32,, 34, 38]]);
      }));

      function similarityCheck() {
        return _ref3.apply(this, arguments);
      }

      return similarityCheck;
    }()
  }], [{
    key: 'model',
    get: function get() {
      return Team;
    }
  }, {
    key: 'schema',
    get: function get() {
      return schema;
    }
  }]);

  return TeamService;
}();

/* harmony default export */ __webpack_exports__["a"] = (TeamService);

/***/ })
/******/ ]);
//# sourceMappingURL=main.map