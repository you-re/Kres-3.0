function createHealthSystem () {
    const MAX_HEALTH = 100;
    let health = MAX_HEALTH;
    let onDeath = () => {};
    let onHealthChange = () => {};

    const damagePower = 1.2;

    function setOnDeath(callback) {
        if (typeof callback === "function") {
            onDeath = callback;
        }
    }

    function setOnHealthChange(callback) {
        if (typeof callback === "function") {
            onHealthChange = callback;
        }
    }

    function takeDamage ( amount ) {
        health = Math.max(0, health - Math.pow(amount, damagePower));
        console.log("Health: " + health);
        onHealthChange(health);

        if ( health <= 0 ) {
            console.log("Ouch! Player died. Respawning...");
            onDeath();
            health = MAX_HEALTH;
            onHealthChange(health);
            console.log("Health reset to " + health);
        }
    }

    return {
        takeDamage,
        getHealth: () => health,
        setOnDeath,
        setOnHealthChange
    }
}

export { createHealthSystem }