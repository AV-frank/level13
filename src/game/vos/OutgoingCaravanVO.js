define(['ash'], function (Ash) {
    
    var OutgoingCaravanVO = Ash.Class.extend({
	
        constructor: function (campOrdinal, tradePartnerOrdinal) {
            this.campOrdinal = campOrdinal;
            this.tradePartnerOrdinal = tradePartnerOrdinal;
            this.sellGood = null;
            this.sellAmount = 0;
            this.buyGood = null;
		},
    });

    return OutgoingCaravanVO;
});
