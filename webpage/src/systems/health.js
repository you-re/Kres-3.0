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

    function takeDamage ( amount, kill = false ) {

        health = Math.max(0, health - Math.pow(amount, damagePower));
        health = Math.ceil(health / 10) * 10;
        console.log("Health: " + health);
        onHealthChange(health);

        if ( health <= 0 || kill ) {
            console.log("Ouch! Player died. Respawning...");
            onDeath();
            health = MAX_HEALTH;
            onHealthChange(health);
            console.log("Health reset to " + health);
        }
    }

    function restoreHealth( amount = "full" ) {
        if (amount === "full") {
            health = MAX_HEALTH;
            console.log("Health restored to max: " + MAX_HEALTH);
        }

        else if (typeof amount === "number" && amount > 0) {
            health = Math.min(MAX_HEALTH, health + amount);
            console.log("Health restored: " + health);
        }
    
        onHealthChange(health);
    }

    return {
        takeDamage,
        restoreHealth,
        getHealth: () => health,
        setOnDeath,
        setOnHealthChange
    }
}

export { createHealthSystem }