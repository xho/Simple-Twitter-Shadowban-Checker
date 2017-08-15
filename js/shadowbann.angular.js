var shadowbannApp = angular.module('app.shadowbann', []);
shadowbannApp.controller('ShadowbannController', function($scope) {
	//setting up for use in  template
	$scope.isArray = angular.isArray;
	$scope.isString = angular.isString;
	//controller
	$scope.username = "Who?";
	$scope.validusername = "";
	$scope.isvalidusername = false;
	$scope.modules = [];
	$scope.selected = null;
	$scope.results = [];
	$scope.hasResults = function(){
		return $scope.results.length > 0;
	};
	$scope.numberOfResults = function(){
		return $scope.results.length;
	}
	var _requiredModuleFunctions = ["query","validate"];
	$scope.listModules = function(){
		$scope.modules = [];
		for(var module in shadowbannModules){
			if(shadowbannModules.hasOwnProperty(module)){
				$scope.modules.push(shadowbannModules[module]);
			}
		}
		if($scope.modules.length > 0){
			$scope.selected = "0";
		}
	};
	$scope.currentModule = function(){
		return $scope.modules[$scope.selected];
	};
	$scope.moduleIndexIsOk = function(index){
		return index >= 0 && index < $scope.modules.length;
	}
	$scope.moduleIsSelected = function(){
		if($scope.selected != null){
			if($scope.isArray($scope.selected)){
				for(var i = 0; i < $scope.selected.length; i++){
					if($scope.moduleIndexIsOk($scope.selected[i])){
					} else {
						return false;
					}
				}
				return true;
			} else {
				if($scope.selected.length > 0 && $scope.moduleIndexIsOk($scope.selected)){
					return true;
				}
			}
		}
		return false;
	};
	$scope.moduleIsOk = function(m){
		m = (typeof m !== 'undefined') ? m : $scope.currentModule();
		if($scope.moduleIsSelected()){
			//var m = $scope.currentModule();
			var requiredFunctions = ["query","validate"];
			for(var i = 0; i < requiredFunctions; i++){
				var _type = typeof m[requiredFunctions[i]];
				if(_type == 'function'){
				} else {
					return false;
				}
			}
			return true;
		}
		return false;
	};
	$scope.validate = function(){
		if($scope.moduleIsSelected()){
			if($scope.moduleIsOk()){
				$scope.validusername = $scope.modules[$scope.selected].validate($scope.username);
				return $scope.validusername != null;
			}
		}
		$scope.validusername = "Who?";
		return false;
	};
	$scope.query = function(){
		//this works fine...
		console.clear();
		$scope.results = [];
		if($scope.moduleIsSelected()){
			if($scope.moduleIsOk()){
				var isvalid = $scope.validate();
				if(isvalid){
					//promise or object
					var res = $scope.modules[$scope.selected].query($scope.validusername);
					var results = Promise.resolve(res);
					console.log("query called and results resolved");
					if(results == res){
						//was a promise
						res.then(function(nres){
							//need to wrap this in apply for some reason...
								/*
								if($scope.isArray(nres)){
									for(var i = 0; i < nres.length; i++){
										$scope.results.push(nres[i]);
									}
								} else {
									$scope.results.push(nres);
								}
								*/
								$scope.results = nres;
								console.log($scope.results);
						}).then(function(){
							$scope.$applyAsync();
						});
					} else {
						console.log("I'm a firing me laser");
						$scope.results = res; //technically results
						console.log($scope.res);
						$scope.$apply();
					}
				}
				else{
					var msg = {
						title: "Invalid Username for "+$scope.modules[$scope.selected].siteName,
						description: "It's as it sounds...",
						details: "The username did not match the format for the website"
					};
					$scope.results = [msg];
					//$scope.results.push(msg);
				}
			} else {
				var msg = {
					title: "Error",
					description: "The selected module is missing required functions",
					details: "query() and/or validate() are missing or not functions"
				};
				$scope.results = [msg];
				//$scope.results.push(msg);
			}
		} else {
			var msg = {
				title: "Error",
				description: "No selected site",
				details: "Without a site selected, there's no way to query results"
			};
			$scope.results.push(msg);
		}
	};
	$scope.listModules();
});

shadowbannApp.directive('submitFormListener', function() {
    return {
        restrict: 'A', // attribute
        scope: {
			query: '&', // bind to parent method
        },
        link: function(scope, elm, attrs) {
            elm.bind('keydown', function(e) {
                if (e.keyCode === 13) {
                    scope.query();
                }
                scope.$apply();
            });
        }
    };
});
shadowbannApp.directive('submitButtonListener', function() {
    return {
        restrict: 'A', // attribute
        scope: {
			query: '&', // bind to parent method
        },
        link: function(scope, elm, attrs) {
            elm.bind('click', function(e) {
				scope.query();
				scope.$apply();
            });
        }
    };
});
/*
shadowbannApp.directive('result-info', function() {
	return {
		restrict: 'C',
		scope: {
			result
		}
		template: ''
	}
});
*/